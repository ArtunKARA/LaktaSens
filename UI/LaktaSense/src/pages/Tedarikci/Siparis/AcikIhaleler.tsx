import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

type Durum = 'a' | 'k' | 't' | 'i';

interface AçıkIhale {
    ihaleID: number;
    ihaleAdi: string;
    ihaleBaslangicTarihi: string;
    ihaleBitisTarihi: string;
    durum: Durum;

    aciklama?: string | null;

    acanFirmaID: number;
    acanFirmaAdi: string;

    yemID: number;
    yemAdi: string;

    talepMiktarKg: number;
    kalanMiktarKg: number;

    teklifSayisi?: number | null;
    enDusukBirimFiyat?: number | null;
    sonTeklifTarihi?: string | null;
}

const durumaGoreBadge = (durum: Durum) => {
    if (durum === 'a') return { className: 'badge bg-success', label: 'Açık' };
    if (durum === 'k') return { className: 'badge bg-warning', label: 'Kapalı' };
    if (durum === 't') return { className: 'badge bg-info', label: 'Tamamlandı' };
    return { className: 'badge bg-danger', label: 'İptal' };
};

const formatDT = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
};

const percent = (part: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
};

const Açıkİhaleler = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [ihaleler, setIhaleler] = useState<AçıkIhale[]>([]);
    const [selected, setSelected] = useState<AçıkIhale | null>(null);

    // Filtreler
    const [arama, setArama] = useState('');
    const [firmaArama, setFirmaArama] = useState('');
    const [yemArama, setYemArama] = useState('');
    const [minKg, setMinKg] = useState('');
    const [maxKg, setMaxKg] = useState('');
    const [tarihFrom, setTarihFrom] = useState('');
    const [tarihTo, setTarihTo] = useState('');
    const [siralama, setSiralama] = useState<'sonTarih_asc' | 'sonTarih_desc' | 'fiyat_asc' | 'fiyat_desc' | 'kg_desc'>('sonTarih_asc');

    // Görünüm
    const [view, setView] = useState<'grid' | 'list'>('grid');

    // Teklif form
    const [teklif, setTeklif] = useState({
        birimFiyat: '',
        miktarKg: '',
        aciklama: '',
        teslimTarihi: '',
    });

    useEffect(() => {
        dispatch(setPageTitle('Açık İhaleler'));
    }, [dispatch]);

    const fetchOpenIhaleler = async () => {
        setLoading(true);
        try {
            // ✅ Endpoint'leri projene göre düzelt:
            // - tedarikci açık ihale listesi
            const payload: any = {
                tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID, // projende ne ise
                // filtreler:
                arama: arama || undefined,
                firmaArama: firmaArama || undefined,
                yemArama: yemArama || undefined,
                minKg: minKg ? Number(minKg) : undefined,
                maxKg: maxKg ? Number(maxKg) : undefined,
                tarihFrom: tarihFrom ? new Date(tarihFrom).toISOString() : undefined,
                tarihTo: tarihTo ? new Date(tarihTo).toISOString() : undefined,
                siralama,
                durum: 'a',
            };

            const res = await fetch('http://localhost:3030/api/tedarikci/ihale/postAcikIhaleList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            setIhaleler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Açık ihaleler alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Açık ihaleler alınamadı.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpenIhaleler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        // Backend filtreliyorsa bile UI’da da “ek güvenlik/instant search”
        const a = arama.trim().toLowerCase();
        const f = firmaArama.trim().toLowerCase();
        const y = yemArama.trim().toLowerCase();

        return ihaleler.filter((x) => {
            const okA = !a || `${x.ihaleAdi} ${x.aciklama || ''}`.toLowerCase().includes(a);
            const okF = !f || (x.acanFirmaAdi || '').toLowerCase().includes(f);
            const okY = !y || (x.yemAdi || '').toLowerCase().includes(y);

            const okMin = !minKg || Number(x.talepMiktarKg || 0) >= Number(minKg);
            const okMax = !maxKg || Number(x.talepMiktarKg || 0) <= Number(maxKg);

            return okA && okF && okY && okMin && okMax;
        });
    }, [ihaleler, arama, firmaArama, yemArama, minKg, maxKg]);

    const kpi = useMemo(() => {
        const total = filtered.length;
        const totalKg = filtered.reduce((acc, x) => acc + Number(x.talepMiktarKg || 0), 0);
        const totalKalan = filtered.reduce((acc, x) => acc + Number(x.kalanMiktarKg || 0), 0);
        const ortFiyat = (() => {
            const prices = filtered.map((x) => Number(x.enDusukBirimFiyat)).filter((n) => !Number.isNaN(n) && n > 0);
            if (!prices.length) return null;
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            return Math.round(avg * 100) / 100;
        })();

        return { total, totalKg, totalKalan, ortFiyat };
    }, [filtered]);
    const openDetayModal = async (ihale: AçıkIhale) => {
        const badge = durumaGoreBadge(ihale.durum);

        await Swal.fire({
            title: `İhale Detayı • #${ihale.ihaleID}`,
            icon: 'info',
            width: 760,
            confirmButtonText: 'Kapat',
            confirmButtonColor: '#6b7280',
            html: `
          <div style="text-align:left">
            <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div style="font-weight:900;font-size:16px;color:#111827">${ihale.ihaleAdi ?? '-'}</div>
              <span style="padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(16,185,129,.15);color:#065f46">
                ${badge.label}
              </span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${infoRow('Açan Firma', ihale.acanFirmaAdi)}
              ${infoRow('Yem', ihale.yemAdi)}
              ${infoRow('Başlangıç', formatDT(ihale.ihaleBaslangicTarihi))}
              ${infoRow('Bitiş', formatDT(ihale.ihaleBitisTarihi))}
              ${infoRow('Talep (kg)', Number(ihale.talepMiktarKg || 0).toLocaleString('tr-TR'))}
              ${infoRow('Kalan (kg)', Number(ihale.kalanMiktarKg || 0).toLocaleString('tr-TR'))}
              ${infoRow('Teklif Sayısı', String(ihale.teklifSayisi ?? 0))}
              ${infoRow('En Düşük Birim', ihale.enDusukBirimFiyat != null ? String(ihale.enDusukBirimFiyat) : '-')}
              ${infoRow('Son Teklif', formatDT(ihale.sonTeklifTarihi))}
            </div>

            ${ihale.aciklama ? `
              <div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06)">
                <div style="font-size:11px;color:#6b7280;font-weight:800;margin-bottom:6px">Açıklama</div>
                <div style="font-size:13px;color:#111827;line-height:1.5">${escapeHtml(ihale.aciklama)}</div>
              </div>
            ` : ''}
          </div>
        `,
        });
    };

    // mini helpers (aynı dosyada, component içinde veya üstünde olabilir)
    const infoRow = (k: string, v: string) => `
  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
    <div style="font-size:11px;color:#6b7280;font-weight:800;margin-bottom:4px">${k}</div>
    <div style="font-size:13px;color:#111827;font-weight:800">${escapeHtml(String(v ?? '-'))}</div>
  </div>
`;

    const escapeHtml = (s: string) =>
        s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

    const openTeklifModal = async (ihale: AçıkIhale) => {
        setSelected(ihale);

        const defaultMiktar = ihale.kalanMiktarKg ? String(ihale.kalanMiktarKg) : '';

        const result = await Swal.fire({
            title: 'Teklif Ver',
            width: 760,
            showCancelButton: true,
            confirmButtonText: 'Devam',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            html: `
          <div style="text-align:left">
            <div style="margin-bottom:10px;padding:12px;border-radius:14px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
              <div style="font-weight:900;color:#111827">${escapeHtml(ihale.ihaleAdi)}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px">${escapeHtml(ihale.acanFirmaAdi)} • ${escapeHtml(ihale.yemAdi)}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:6px">Kalan: <b>${Number(ihale.kalanMiktarKg || 0).toLocaleString('tr-TR')}</b> kg</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label style="font-size:12px;font-weight:800;color:#374151">Birim Fiyat *</label>
                <input id="sw-birim" type="number" min="0" step="0.01"
                  style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)"
                  placeholder="Örn: 12.50" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:800;color:#374151">Miktar (kg) *</label>
                <input id="sw-miktar" type="number" min="0" step="1"
                  value="${escapeHtml(defaultMiktar)}"
                  style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)"
                  placeholder="Örn: 500" />
              </div>
              <div style="grid-column:1 / -1">
                <label style="font-size:12px;font-weight:800;color:#374151">Teslim Tarihi</label>
                <input id="sw-teslim" type="datetime-local"
                  style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
              </div>
              <div style="grid-column:1 / -1">
                <label style="font-size:12px;font-weight:800;color:#374151">Açıklama</label>
                <textarea id="sw-aciklama"
                  style="margin-top:6px;width:100%;min-height:90px;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)"
                  placeholder="Teslim koşulları / kalite notları / ödeme şartı..."></textarea>
              </div>
            </div>
          </div>
        `,
            preConfirm: () => {
                const birimFiyat = Number((document.getElementById('sw-birim') as HTMLInputElement)?.value);
                const miktarKg = Number((document.getElementById('sw-miktar') as HTMLInputElement)?.value);
                const teslimTarihi = (document.getElementById('sw-teslim') as HTMLInputElement)?.value;
                const aciklama = (document.getElementById('sw-aciklama') as HTMLTextAreaElement)?.value ?? '';

                if (!Number.isFinite(birimFiyat) || birimFiyat <= 0) {
                    Swal.showValidationMessage('Birim fiyat zorunlu ve 0’dan büyük olmalı.');
                    return;
                }
                if (!Number.isFinite(miktarKg) || miktarKg <= 0) {
                    Swal.showValidationMessage('Miktar zorunlu ve 0’dan büyük olmalı.');
                    return;
                }
                const limit = Number(ihale.kalanMiktarKg || ihale.talepMiktarKg || 0);
                if (miktarKg > limit) {
                    Swal.showValidationMessage('Miktar, kalan/talep miktarından büyük olamaz.');
                    return;
                }

                return { birimFiyat, miktarKg, teslimTarihi, aciklama };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        const confirm = await Swal.fire({
            title: 'Teklifi Onaylıyor musunuz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Gönder',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
        });

        if (!confirm.isConfirmed) return;

        setSaving(true);
        try {
            const payload = {
                ihaleID: ihale.ihaleID,
                tedarikciFirmaID: userInfo?.firmaID || userInfo?.tedarikciID,
                birimFiyat: Number(result.value.birimFiyat),
                miktarKg: Number(result.value.miktarKg),
                aciklama: result.value.aciklama?.trim() || undefined,
                teslimTarihi: result.value.teslimTarihi ? new Date(result.value.teslimTarihi).toISOString() : undefined,
                yapanKullaniciID: userInfo?.kullaniciID,
            };

            const res = await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Teklif gönderilemedi');

            await Swal.fire({ icon: 'success', title: 'Teklif gönderildi', timer: 1200, showConfirmButton: false });

            fetchOpenIhaleler();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Teklif gönderilemedi.' });
        } finally {
            setSaving(false);
        }
    };

    const validateTeklif = () => {
        if (!selected) return 'İhale seçilmedi.';
        if (!teklif.birimFiyat || Number(teklif.birimFiyat) <= 0) return 'Birim fiyat zorunlu ve 0’dan büyük olmalı.';
        if (!teklif.miktarKg || Number(teklif.miktarKg) <= 0) return 'Miktar zorunlu ve 0’dan büyük olmalı.';
        if (Number(teklif.miktarKg) > Number(selected.kalanMiktarKg || selected.talepMiktarKg || 0)) return 'Miktar, kalan/talep miktarından büyük olamaz.';
        return null;
    };

    const submitTeklif = async () => {
        const errMsg = validateTeklif();
        if (errMsg) {
            Swal.fire({ icon: 'warning', title: 'Eksik / Hatalı', text: errMsg });
            return;
        }
        if (!selected) return;

        const confirm = await Swal.fire({
            title: 'Teklifi Onaylıyor musunuz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Gönder',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            html: `
                <div style="text-align:left;margin-top:10px">
                    <div style="border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:16px;box-shadow:0 10px 28px rgba(0,0,0,.10);background:#fff">
                        <div style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(0,0,0,.06);border-radius:10px;background:rgba(0,0,0,.03);margin-bottom:10px">
                            <span style="font-size:12px;color:#6b7280;font-weight:700">İhale</span>
                            <span style="font-size:13px;color:#111827;font-weight:800">${selected.ihaleAdi}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(0,0,0,.06);border-radius:10px;background:rgba(0,0,0,.03);margin-bottom:10px">
                            <span style="font-size:12px;color:#6b7280;font-weight:700">Yem</span>
                            <span style="font-size:13px;color:#1d4ed8;font-weight:900">${selected.yemAdi}</span>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                            <div style="padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                                <div style="font-size:11px;color:#6b7280;font-weight:700;margin-bottom:4px">Birim Fiyat</div>
                                <div style="font-size:14px;color:#111827;font-weight:900">${teklif.birimFiyat}</div>
                            </div>
                            <div style="padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                                <div style="font-size:11px;color:#6b7280;font-weight:700;margin-bottom:4px">Miktar (kg)</div>
                                <div style="font-size:14px;color:#111827;font-weight:900">${teklif.miktarKg}</div>
                            </div>
                        </div>
                        ${teklif.teslimTarihi
                    ? `<div style="margin-top:12px;padding:10px 12px;border:1px solid rgba(0,0,0,.06);border-radius:10px;background:rgba(0,0,0,.03)">
                                     <div style="font-size:11px;color:#6b7280;font-weight:700;margin-bottom:4px">Teslim Tarihi</div>
                                     <div style="font-size:13px;color:#111827;font-weight:800">${new Date(teklif.teslimTarihi).toLocaleString('tr-TR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    })}</div>
                                   </div>`
                    : ''
                }
                        ${teklif.aciklama?.trim()
                    ? `<div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.05)">
                                     <div style="font-size:11px;color:#6b7280;font-weight:700;margin-bottom:4px">Açıklama</div>
                                     <div style="font-size:13px;color:#111827">${teklif.aciklama}</div>
                                   </div>`
                    : ''
                }
                    </div>
                    <div style="margin-top:12px;font-size:12px;color:#6b7280">Onaylarsanız teklifiniz ihaleye iletilecektir.</div>
                </div>
            `,
        });

        if (!confirm.isConfirmed) return;

        setSaving(true);
        try {
            // ✅ Endpoint'i projene göre düzelt:
            const payload = {
                ihaleID: selected.ihaleID,
                tedarikciFirmaID: userInfo?.firmaID || userInfo?.tedarikciID,
                birimFiyat: Number(teklif.birimFiyat),
                miktarKg: Number(teklif.miktarKg),
                aciklama: teklif.aciklama || undefined,
                teslimTarihi: teklif.teslimTarihi ? new Date(teklif.teslimTarihi).toISOString() : undefined,
                yapanKullaniciID: userInfo?.kullaniciID,
            };

            const res = await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Teklif gönderilemedi');

            await Swal.fire({
                icon: 'success',
                title: 'Teklif gönderildi',
                timer: 1200,
                showConfirmButton: false,
            });

            // refresh
            setSelected(null);
            setTeklif({ birimFiyat: '', miktarKg: '', aciklama: '', teslimTarihi: '' });
            fetchOpenIhaleler();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Teklif gönderilemedi.' });
        } finally {
            setSaving(false);
        }
    };

    const IhaleCard = ({ ihale }: { ihale: AçıkIhale }) => {
        const badge = durumaGoreBadge(ihale.durum);
        const kalan = Number(ihale.kalanMiktarKg ?? 0);
        const talep = Number(ihale.talepMiktarKg ?? 0);
        const doluluk = percent(talep - kalan, talep);

        return (
            <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 shadow-sm hover:shadow-md transition p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold truncate">{ihale.ihaleAdi || 'İhale'}</div>
                            <span className={badge.className}>{badge.label}</span>
                        </div>
                        <div className="text-xs text-white-dark mt-1 truncate">
                            {ihale.acanFirmaAdi} • {ihale.yemAdi}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-white-dark">Son Tarih</div>
                        <div className="text-sm font-semibold">{formatDT(ihale.ihaleBitisTarihi)}</div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Talep</div>
                        <div className="text-lg font-semibold">{talep.toLocaleString('tr-TR')} kg</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Kalan</div>
                        <div className="text-lg font-semibold">{kalan.toLocaleString('tr-TR')} kg</div>
                    </div>
                </div>

                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white-dark mb-1">
                        <span>Karşılama</span>
                        <span>%{doluluk}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white-light dark:bg-[#1b2e4b] overflow-hidden">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${doluluk}%` }} />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Teklif</div>
                        <div className="font-semibold">{ihale.teklifSayisi ?? 0}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">En Düşük</div>
                        <div className="font-semibold">{ihale.enDusukBirimFiyat ?? '-'}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Son Teklif</div>
                        <div className="font-semibold">{formatDT(ihale.sonTeklifTarihi)}</div>
                    </div>
                </div>

                {ihale.aciklama ? (
                    <div className="mt-3 rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark mb-1">Açıklama</div>
                        <div className="text-sm line-clamp-2">{ihale.aciklama}</div>
                    </div>
                ) : null}

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetayModal(ihale); }}
                    >
                        Detay
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={saving}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTeklifModal(ihale); }}
                    >
                        Teklif Ver
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h5 className="text-lg font-semibold">Açık İhaleler</h5>
                        <p className="text-sm text-white-dark mt-1">
                            Açık ihaleleri filtrele, teklif ver ve tekliflerini takip et.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchOpenIhaleler} disabled={loading}>
                            {loading ? 'Yükleniyor...' : 'Yenile'}
                        </button>
                        <div className="flex items-center rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden">
                            <button
                                className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-primary text-white' : 'bg-transparent'}`}
                                onClick={() => setView('grid')}
                                type="button"
                            >
                                Grid
                            </button>
                            <button
                                className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-primary text-white' : 'bg-transparent'}`}
                                onClick={() => setView('list')}
                                type="button"
                            >
                                Liste
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters + KPI */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h6 className="font-semibold">Filtreler</h6>
                    <div className="text-xs text-white-dark">
                        Kayıt: <b>{kpi.total}</b> • Toplam Talep: <b>{kpi.totalKg.toLocaleString('tr-TR')}</b> kg • Kalan:{' '}
                        <b>{kpi.totalKalan.toLocaleString('tr-TR')}</b> kg • Ortalama En Düşük: <b>{kpi.ortFiyat ?? '-'}</b>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Genel Arama</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="İhale adı / açıklama" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Firma</label>
                        <input className="form-input w-full" value={firmaArama} onChange={(e) => setFirmaArama(e.target.value)} placeholder="Açan firma adı" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Yem</label>
                        <input className="form-input w-full" value={yemArama} onChange={(e) => setYemArama(e.target.value)} placeholder="Yem adı" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Sıralama</label>
                        <select className="form-select w-full" value={siralama} onChange={(e) => setSiralama(e.target.value as any)}>
                            <option value="sonTarih_asc">Son Tarih (Yakın)</option>
                            <option value="sonTarih_desc">Son Tarih (Uzak)</option>
                            <option value="fiyat_asc">En Düşük Fiyat (Artan)</option>
                            <option value="fiyat_desc">En Düşük Fiyat (Azalan)</option>
                            <option value="kg_desc">Talep (Yüksek)</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Min KG</label>
                        <input type="number" className="form-input w-full" value={minKg} onChange={(e) => setMinKg(e.target.value)} placeholder="0" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Max KG</label>
                        <input type="number" className="form-input w-full" value={maxKg} onChange={(e) => setMaxKg(e.target.value)} placeholder="-" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Tarih (Başlangıç)</label>
                        <input type="date" className="form-input w-full" value={tarihFrom} onChange={(e) => setTarihFrom(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Tarih (Bitiş)</label>
                        <input type="date" className="form-input w-full" value={tarihTo} onChange={(e) => setTarihTo(e.target.value)} />
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setArama('');
                                setFirmaArama('');
                                setYemArama('');
                                setMinKg('');
                                setMaxKg('');
                                setTarihFrom('');
                                setTarihTo('');
                                setSiralama('sonTarih_asc');
                            }}
                            type="button"
                        >
                            Temizle
                        </button>
                        <button className="btn btn-primary" onClick={fetchOpenIhaleler} disabled={loading} type="button">
                            {loading ? 'Yükleniyor...' : 'Uygula'}
                        </button>
                    </div>
                </div>
            </div>

            {/* List/Grid */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">Açık İhale Listesi</h5>
                    <div className="text-xs text-white-dark">
                        Gösterilen: <b>{filtered.length}</b>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-6 shadow-sm text-center text-white-dark">
                        Kayıt bulunamadı.
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((ihale) => (
                            <IhaleCard key={ihale.ihaleID} ihale={ihale} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>İhale</th>
                                        <th>Firma</th>
                                        <th>Yem</th>
                                        <th>Talep</th>
                                        <th>Kalan</th>
                                        <th>Son Tarih</th>
                                        <th>Teklif</th>
                                        <th>En Düşük</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((ihale) => {
                                        const badge = durumaGoreBadge(ihale.durum);
                                        return (
                                            <tr key={ihale.ihaleID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                                <td className="font-semibold">{ihale.ihaleID}</td>
                                                <td>
                                                    <div className="font-semibold">{ihale.ihaleAdi}</div>
                                                    <div className="text-xs text-white-dark">{badge.label}</div>
                                                </td>
                                                <td>{ihale.acanFirmaAdi}</td>
                                                <td>{ihale.yemAdi}</td>
                                                <td>{Number(ihale.talepMiktarKg || 0).toLocaleString('tr-TR')}</td>
                                                <td>{Number(ihale.kalanMiktarKg || 0).toLocaleString('tr-TR')}</td>
                                                <td className="whitespace-nowrap">{formatDT(ihale.ihaleBitisTarihi)}</td>
                                                <td className="whitespace-nowrap">{ihale.teklifSayisi ?? 0}</td>
                                                <td className="whitespace-nowrap">{ihale.enDusukBirimFiyat ?? '-'}</td>
                                                <td className="whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/tedarikci/ihale/${ihale.ihaleID}`)}>
                                                            Detay
                                                        </button>
                                                        <button className="btn btn-sm btn-primary" onClick={() => openTeklifModal(ihale)}>
                                                            Teklif Ver
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Teklif Paneli (sayfanın altında net sınırlarla) */}
            <div className="panel p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">Teklif Hazırlama</h5>
                        <p className="text-sm text-white-dark mt-1">
                            {selected ? (
                                <>
                                    Seçili ihale: <b>{selected.ihaleAdi}</b> • <span className="text-primary font-semibold">{selected.yemAdi}</span> • Kalan:{' '}
                                    <b>{Number(selected.kalanMiktarKg || 0).toLocaleString('tr-TR')}</b> kg
                                </>
                            ) : (
                                'Teklif vermek için listeden bir ihale seç.'
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setSelected(null);
                                setTeklif({ birimFiyat: '', miktarKg: '', aciklama: '', teslimTarihi: '' });
                            }}
                            type="button"
                        >
                            Temizle
                        </button>
                        <button className="btn btn-primary" onClick={submitTeklif} disabled={!selected || saving} type="button">
                            {saving ? 'Gönderiliyor...' : 'Teklifi Gönder'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Birim Fiyat *</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={teklif.birimFiyat}
                            onChange={(e) => setTeklif((p) => ({ ...p, birimFiyat: e.target.value }))}
                            placeholder="Örn: 12.50"
                            disabled={!selected}
                            min={0}
                        />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Miktar (kg) *</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={teklif.miktarKg}
                            onChange={(e) => setTeklif((p) => ({ ...p, miktarKg: e.target.value }))}
                            placeholder="Örn: 500"
                            disabled={!selected}
                            min={0}
                        />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Teslim Tarihi</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={teklif.teslimTarihi}
                            onChange={(e) => setTeklif((p) => ({ ...p, teslimTarihi: e.target.value }))}
                            disabled={!selected}
                        />
                    </div>

                    <div className="md:col-span-4 rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Teklif Açıklaması</label>
                        <textarea
                            className="form-textarea w-full min-h-[90px]"
                            value={teklif.aciklama}
                            onChange={(e) => setTeklif((p) => ({ ...p, aciklama: e.target.value }))}
                            placeholder="Teslim koşulları / kalite notları / ödeme şartı..."
                            disabled={!selected}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Açıkİhaleler;
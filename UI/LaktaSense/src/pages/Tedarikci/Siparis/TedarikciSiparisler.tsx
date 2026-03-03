import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Swal from 'sweetalert2';

type SiparisDurum = 'b' | 'o' | 'islemde' | 't' | 'r' | 'i' | string; // beklemede / onay / işlemde / tamam / red / iptal

interface SiparisRow {
    siparisID: number;
    teklifID?: number | null;

    olusturanFirmaID: number; // çiftçi firma
    ciftciFirmaAdi?: string | null;

    tedarikciID: number;
    tedarikciAdi?: string | null;

    yemID: number;
    yemAdi: string;

    siparisTarihi: string;
    miktarKg: number;
    birimFiyat: number;
    toplamTutar: number;

    durum: SiparisDurum;
    kaynakTipi?: 'ihale' | 'market' | string | null;

    aciklama?: string | null;
}

interface SevkiyatRow {
    SevkiyatID: number;
    SiparisID: number;
    SevkTarihi: string;
    BeklenenTeslim: string;
    Durum: string;

    YemID: number;
    yemAdi: string;
    MiktarKg: number;
}

const API = {
    // ✅ Bu sayfada tedarikçi kendi siparişlerini görecek: payload ile tedarikciID gönderiyoruz.
    // Eğer backend’de tedarikçi endpointlerin varsa sadece burayı değiştir.
    list: 'http://localhost:3030/api/tedarikci/siparis/postSiparisList',
    detailShipments: 'http://localhost:3030/api/ciftci/siparis/postSevkiyatList',

    // ✅ aşağıdaki action endpointleri sende varsa düzenle (isimler örnek)
    approve: 'http://localhost:3030/api/tedarikci/siparis/postSiparisOnayla',
    process: 'http://localhost:3030/api/tedarikci/siparis/postSiparisIslemeAl',
    reject: 'http://localhost:3030/api/tedarikci/siparis/postSiparisReddet',
    cancel: 'http://localhost:3030/api/tedarikci/siparis/postSiparisIptal',

    shipmentCreate: 'http://localhost:3030/api/tedarikci/siparis/postSevkiyatOlustur',
    shipmentCancel: 'http://localhost:3030/api/tedarikci/siparis/postSevkiyatIptal',
};

const formatDT = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
};

const money = (v?: number | null) => {
    if (v == null || Number.isNaN(Number(v))) return '-';
    return Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const badgeSiparis = (d: SiparisDurum) => {
    // senin sistemde durum harfleri farklıysa burayı güncellersin
    if (d === 'b') return { className: 'badge bg-warning', label: 'Beklemede' };
    if (d === 'o') return { className: 'badge bg-primary', label: 'Onaylandı' };
    if (d === 'islemde') return { className: 'badge bg-info', label: 'İşlemde' };
    if (d === 't') return { className: 'badge bg-success', label: 'Tamamlandı' };
    if (d === 'r') return { className: 'badge bg-danger', label: 'Reddedildi' };
    if (d === 'i') return { className: 'badge bg-secondary', label: 'İptal' };
    return { className: 'badge bg-secondary', label: String(d ?? 'Bilinmiyor') };
};

const kaynakText = (k?: string | null) => {
    if (k === 'ihale') return 'İhale';
    if (k === 'market') return 'Market';
    return k || '-';
};

const escapeHtml = (s: string) =>
    (s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const infoRow = (k: string, v: any) => `
  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">${escapeHtml(k)}</div>
    <div style="font-size:13px;color:#111827;font-weight:800">${escapeHtml(String(v ?? '-'))}</div>
  </div>
`;

const TedarikciSiparisYonetimi = () => {
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [rows, setRows] = useState<SiparisRow[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const [arama, setArama] = useState('');
    const [durum, setDurum] = useState<string>(''); // hepsi = ''
    const [kaynak, setKaynak] = useState<string>(''); // hepsi = ''
    const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'tutar_desc' | 'tutar_asc'>('tarih_desc');

    const [selectedSiparisID, setSelectedSiparisID] = useState<number | null>(null);
    const [sevkiyatlar, setSevkiyatlar] = useState<SevkiyatRow[]>([]);
    const [loadingSevkiyat, setLoadingSevkiyat] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Yönetimi (Tedarikçi)'));
    }, [dispatch]);

    const fetchSiparisler = async () => {
        setLoading(true);
        try {
            const payload = {
                // ✅ kritik: tedarikçinin kendi siparişleri
                tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,

                // filtreler
                durum: durum || undefined,
                kaynakTipi: kaynak || undefined,
            };

            const res = await fetch(API.list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            const arr = Array.isArray(data) ? data : [];

            // eğer backend filtrelemezse, burada client-side da kısıtlıyoruz
            const onlyMine = arr.filter((x: SiparisRow) => Number(x.tedarikciID) === Number(payload.tedarikciID));

            setRows(onlyMine);
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Siparişler alınamadı.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSevkiyatlar = async (siparisID: number) => {
        setLoadingSevkiyat(true);
        try {
            const res = await fetch(API.detailShipments, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID }),
            });
            const data = await res.json();
            setSevkiyatlar(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Sevkiyatlar alınamadı.' });
        } finally {
            setLoadingSevkiyat(false);
        }
    };

    useEffect(() => {
        fetchSiparisler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const a = arama.trim().toLowerCase();

        return rows
            .filter((x) => {
                const okA =
                    !a ||
                    `${x.siparisID} ${x.ciftciFirmaAdi ?? ''} ${x.yemAdi ?? ''} ${x.tedarikciAdi ?? ''}`.toLowerCase().includes(a);

                const okD = !durum || String(x.durum) === String(durum);
                const okK = !kaynak || String(x.kaynakTipi) === String(kaynak);

                return okA && okD && okK;
            })
            .sort((a, b) => {
                if (siralama === 'tarih_desc') return +new Date(b.siparisTarihi) - +new Date(a.siparisTarihi);
                if (siralama === 'tarih_asc') return +new Date(a.siparisTarihi) - +new Date(b.siparisTarihi);
                if (siralama === 'tutar_desc') return Number(b.toplamTutar ?? 0) - Number(a.toplamTutar ?? 0);
                if (siralama === 'tutar_asc') return Number(a.toplamTutar ?? 0) - Number(b.toplamTutar ?? 0);
                return 0;
            });
    }, [rows, arama, durum, kaynak, siralama]);

    const kpi = useMemo(() => {
        const total = filtered.length;
        const bekleyen = filtered.filter((x) => x.durum === 'b').length;
        const onayli = filtered.filter((x) => x.durum === 'o').length;
        const islemde = filtered.filter((x) => x.durum === 'islemde').length;
        const tamam = filtered.filter((x) => x.durum === 't').length;
        const iptal = filtered.filter((x) => x.durum === 'i').length;
        const red = filtered.filter((x) => x.durum === 'r').length;

        const toplamCiro = filtered.reduce((p, c) => p + Number(c.toplamTutar || 0), 0);

        return { total, bekleyen, onayli, islemde, tamam, iptal, red, toplamCiro };
    }, [filtered]);

    const openDetay = async (row: SiparisRow) => {
        const b = badgeSiparis(row.durum);
        await Swal.fire({
            title: `Sipariş #${row.siparisID}`,
            icon: 'info',
            width: 860,
            confirmButtonText: 'Kapat',
            html: `
              <div style="text-align:left">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
                  <div style="font-weight:900;color:#111827;font-size:16px">${escapeHtml(row.yemAdi)}</div>
                  <span style="padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:rgba(37,99,235,.12);color:#1d4ed8">
                    ${escapeHtml(b.label)}
                  </span>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  ${infoRow('Çiftçi', row.ciftciFirmaAdi ?? row.olusturanFirmaID)}
                  ${infoRow('Kaynak', kaynakText(row.kaynakTipi))}
                  ${infoRow('Sipariş Tarihi', formatDT(row.siparisTarihi))}
                  ${infoRow('Yem', `${row.yemAdi} (#${row.yemID})`)}
                  ${infoRow('Miktar (kg)', Number(row.miktarKg || 0).toLocaleString('tr-TR'))}
                  ${infoRow('Birim Fiyat', money(row.birimFiyat))}
                  ${infoRow('Toplam Tutar', money(row.toplamTutar))}
                  ${infoRow('Tedarikçi', row.tedarikciAdi ?? row.tedarikciID)}
                </div>

                ${row.aciklama ? `
                  <div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:6px">Not</div>
                    <div style="font-size:13px;color:#111827;line-height:1.5">${escapeHtml(row.aciklama)}</div>
                  </div>
                ` : ''}
              </div>
            `,
        });
    };

    // ---------------- Actions (Onay / İşleme Al / Red / İptal) ----------------
    const actionPost = async (url: string, payload: any, successMsg: string) => {
        setSaving(true);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const txt = await res.text();
            let data: any = null;
            try {
                data = txt ? JSON.parse(txt) : null;
            } catch {
                data = txt;
            }

            if (!res.ok) {
                const msg = typeof data === 'string' ? data : data?.message || data?.error || 'İşlem başarısız.';
                throw new Error(msg);
            }

            await Swal.fire({ icon: 'success', title: successMsg, timer: 1100, showConfirmButton: false });
            fetchSiparisler();
            if (selectedSiparisID) fetchSevkiyatlar(selectedSiparisID);
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'İşlem başarısız.' });
        } finally {
            setSaving(false);
        }
    };

    const siparisOnayla = async (row: SiparisRow) => {
        if (row.durum !== 'b') {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Sadece bekleyen sipariş onaylanabilir.' });
            return;
        }
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Sipariş onaylansın mı?',
            text: `Sipariş #${row.siparisID}`,
            showCancelButton: true,
            confirmButtonText: 'Onayla',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
        });
        if (!confirm.isConfirmed) return;

        await actionPost(API.approve, {
            siparisID: row.siparisID,
            tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            yapanKullaniciID: userInfo?.kullaniciID,
        }, 'Onaylandı');
    };

    const siparisIslemeAl = async (row: SiparisRow) => {
        if (!(row.durum === 'o' || row.durum === 'b' || row.durum === 'islemde')) {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Bu sipariş işlemeye uygun değil.' });
            return;
        }
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Sipariş işleme alınsın mı?',
            text: `Sipariş #${row.siparisID}`,
            showCancelButton: true,
            confirmButtonText: 'İşleme Al',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#0ea5e9',
        });
        if (!confirm.isConfirmed) return;

        await actionPost(API.process, {
            siparisID: row.siparisID,
            tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            yapanKullaniciID: userInfo?.kullaniciID,
        }, 'İşleme alındı');
    };

    const siparisReddet = async (row: SiparisRow) => {
        if (row.durum !== 'b') {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Sadece bekleyen sipariş reddedilebilir.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Siparişi Reddet',
            icon: 'warning',
            width: 720,
            showCancelButton: true,
            confirmButtonText: 'Reddet',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#dc2626',
            html: `
              <div style="text-align:left">
                <div style="margin-bottom:10px;color:#6b7280;font-size:12px">Sipariş #${row.siparisID} • ${escapeHtml(row.yemAdi)}</div>
                <label style="font-size:12px;font-weight:900;color:#374151">Red Nedeni *</label>
                <textarea id="sw-reason" rows="3"
                  style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)"></textarea>
              </div>
            `,
            preConfirm: () => {
                const reason = (document.getElementById('sw-reason') as HTMLTextAreaElement)?.value?.trim();
                if (!reason) {
                    Swal.showValidationMessage('Red nedeni zorunlu.');
                    return;
                }
                return { reason };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        await actionPost(API.reject, {
            siparisID: row.siparisID,
            tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            redNedeni: result.value.reason,
            yapanKullaniciID: userInfo?.kullaniciID,
        }, 'Reddedildi');
    };

    const siparisIptal = async (row: SiparisRow) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Siparişi iptal etmek istiyor musunuz?',
            text: `Sipariş #${row.siparisID}`,
            showCancelButton: true,
            confirmButtonText: 'İptal Et',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#6b7280',
        });
        if (!confirm.isConfirmed) return;

        await actionPost(API.cancel, {
            siparisID: row.siparisID,
            tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            yapanKullaniciID: userInfo?.kullaniciID,
        }, 'İptal edildi');
    };

    // ---------------- Sevkiyat işlemleri ----------------
    const sevkiyatOlustur = async () => {
        if (!selectedSiparisID) {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Önce bir sipariş seçin.' });
            return;
        }

        const row = rows.find((x) => x.siparisID === selectedSiparisID);
        const maxKg = row?.miktarKg ?? null;

        const result = await Swal.fire({
            title: 'Sevkiyat Oluştur',
            width: 760,
            showCancelButton: true,
            confirmButtonText: 'Oluştur',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            html: `
              <div style="text-align:left">
                <div style="margin-bottom:10px;color:#6b7280;font-size:12px">Sipariş #${selectedSiparisID}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div>
                    <label style="font-size:12px;font-weight:900;color:#374151">Sevk Tarihi *</label>
                    <input id="sw-sevk" type="datetime-local"
                      style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:900;color:#374151">Beklenen Teslim *</label>
                    <input id="sw-teslim" type="datetime-local"
                      style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
                  </div>
                  <div style="grid-column:1/3">
                    <label style="font-size:12px;font-weight:900;color:#374151">Miktar (kg) *</label>
                    <input id="sw-kg" type="number" step="1" min="1" value="${maxKg ? Math.min(maxKg, 1) : 1}"
                      style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
                    <div style="margin-top:6px;font-size:11px;color:#6b7280">Sipariş miktarı: ${maxKg ?? '-'} kg</div>
                  </div>
                </div>
              </div>
            `,
            preConfirm: () => {
                const sevkTarihi = (document.getElementById('sw-sevk') as HTMLInputElement)?.value;
                const teslim = (document.getElementById('sw-teslim') as HTMLInputElement)?.value;
                const kg = Number((document.getElementById('sw-kg') as HTMLInputElement)?.value);

                if (!sevkTarihi) {
                    Swal.showValidationMessage('Sevk tarihi zorunlu.');
                    return;
                }
                if (!teslim) {
                    Swal.showValidationMessage('Beklenen teslim zorunlu.');
                    return;
                }
                if (!Number.isFinite(kg) || kg <= 0) {
                    Swal.showValidationMessage('Miktar 0’dan büyük olmalı.');
                    return;
                }
                if (maxKg != null && Number.isFinite(maxKg) && kg > maxKg) {
                    Swal.showValidationMessage('Sevkiyat miktarı sipariş miktarını aşamaz.');
                    return;
                }
                return { sevkTarihi, teslim, kg };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        await actionPost(
            API.shipmentCreate,
            {
                siparisID: selectedSiparisID,
                sevkTarihi: result.value.sevkTarihi,
                beklenenTeslim: result.value.teslim,
                miktarKg: Number(result.value.kg),
                yapanKullaniciID: userInfo?.kullaniciID,
                tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            },
            'Sevkiyat oluşturuldu'
        );
    };

    const sevkiyatIptal = async (sevkiyatID: number) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Sevkiyat iptal edilsin mi?',
            text: `Sevkiyat #${sevkiyatID}`,
            showCancelButton: true,
            confirmButtonText: 'İptal Et',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;

        await actionPost(
            API.shipmentCancel,
            {
                sevkiyatID,
                yapanKullaniciID: userInfo?.kullaniciID,
                tedarikciID: userInfo?.firmaID || userInfo?.tedarikciID,
            },
            'Sevkiyat iptal edildi'
        );
    };

    const OrderCard = ({ row }: { row: SiparisRow }) => {
        const b = badgeSiparis(row.durum);
        const selected = selectedSiparisID === row.siparisID;

        return (
            <div className={`rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 shadow-sm hover:shadow-md transition p-4 ${selected ? 'ring-2 ring-primary/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold truncate">{row.yemAdi}</div>
                            <span className={b.className}>{b.label}</span>
                        </div>
                        <div className="text-xs text-white-dark mt-1 truncate">
                            Çiftçi: {row.ciftciFirmaAdi ?? row.olusturanFirmaID} • Kaynak: {kaynakText(row.kaynakTipi)}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-white-dark">Sipariş</div>
                        <div className="text-sm font-semibold">#{row.siparisID}</div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Miktar</div>
                        <div className="text-lg font-semibold">{Number(row.miktarKg || 0).toLocaleString('tr-TR')} kg</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Birim</div>
                        <div className="text-lg font-semibold">{money(row.birimFiyat)}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Toplam</div>
                        <div className="text-lg font-semibold">{money(row.toplamTutar)}</div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-white-dark">Tarih: <b>{formatDT(row.siparisTarihi)}</b></div>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => openDetay(row)}>
                            Detay
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={saving}
                            onClick={() => {
                                setSelectedSiparisID(row.siparisID);
                                fetchSevkiyatlar(row.siparisID);
                            }}
                        >
                            Seç
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <button type="button" className="btn btn-outline-primary" disabled={saving || row.durum !== 'b'} onClick={() => siparisOnayla(row)}>
                        Onayla
                    </button>
                    <button type="button" className="btn btn-outline-info" disabled={saving || (row.durum !== 'o' && row.durum !== 'b' && row.durum !== 'islemde')} onClick={() => siparisIslemeAl(row)}>
                        İşleme Al
                    </button>
                    <button type="button" className="btn btn-outline-danger" disabled={saving || row.durum !== 'b'} onClick={() => siparisReddet(row)}>
                        Reddet
                    </button>
                    <button type="button" className="btn btn-outline-secondary" disabled={saving || row.durum === 'i' || row.durum === 't'} onClick={() => siparisIptal(row)}>
                        İptal
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
                        <h5 className="text-lg font-semibold">Sipariş Yönetimi (Tedarikçi)</h5>
                        <p className="text-sm text-white-dark mt-1">Kendi ürünlerin için gelen siparişleri gör, onayla/işleme al/reddet/iptal et, sevkiyat oluştur.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchSiparisler} disabled={loading}>
                            {loading ? 'Yükleniyor...' : 'Yenile'}
                        </button>

                        <div className="flex items-center rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden">
                            <button className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setView('grid')} type="button">
                                Grid
                            </button>
                            <button className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setView('list')} type="button">
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
                        Toplam: <b>{kpi.total}</b> • Bekleyen: <b>{kpi.bekleyen}</b> • Onaylı: <b>{kpi.onayli}</b> • İşlemde: <b>{kpi.islemde}</b> • Tamam: <b>{kpi.tamam}</b> • İptal: <b>{kpi.iptal}</b> • Red: <b>{kpi.red}</b> • Ciro: <b>{money(kpi.toplamCiro)}</b>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Arama</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Sipariş / çiftçi / yem" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Durum</label>
                        <select className="form-select w-full" value={durum} onChange={(e) => setDurum(e.target.value)}>
                            <option value="">Hepsi</option>
                            <option value="b">Beklemede</option>
                            <option value="o">Onaylandı</option>
                            <option value="islemde">İşlemde</option>
                            <option value="t">Tamamlandı</option>
                            <option value="r">Reddedildi</option>
                            <option value="i">İptal</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Kaynak</label>
                        <select className="form-select w-full" value={kaynak} onChange={(e) => setKaynak(e.target.value)}>
                            <option value="">Hepsi</option>
                            <option value="market">Market</option>
                            <option value="ihale">İhale</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Sıralama</label>
                        <select className="form-select w-full" value={siralama} onChange={(e) => setSiralama(e.target.value as any)}>
                            <option value="tarih_desc">Tarih (Yeni)</option>
                            <option value="tarih_asc">Tarih (Eski)</option>
                            <option value="tutar_desc">Tutar (Azalan)</option>
                            <option value="tutar_asc">Tutar (Artan)</option>
                        </select>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => {
                                setArama('');
                                setDurum('');
                                setKaynak('');
                                setSiralama('tarih_desc');
                            }}
                        >
                            Temizle
                        </button>
                        <button className="btn btn-primary" type="button" onClick={fetchSiparisler} disabled={loading}>
                            {loading ? 'Yükleniyor...' : 'Uygula'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">Siparişler</h5>
                    <div className="text-xs text-white-dark">
                        Gösterilen: <b>{filtered.length}</b> • Seçili: <b>{selectedSiparisID ?? '-'}</b>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-6 shadow-sm text-center text-white-dark">
                        Kayıt bulunamadı.
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((row) => (
                            <OrderCard key={row.siparisID} row={row} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>SiparişID</th>
                                        <th>Çiftçi</th>
                                        <th>Yem</th>
                                        <th>Miktar</th>
                                        <th>Birim</th>
                                        <th>Toplam</th>
                                        <th>Tarih</th>
                                        <th>Kaynak</th>
                                        <th>Durum</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => {
                                        const b = badgeSiparis(row.durum);
                                        const selected = selectedSiparisID === row.siparisID;

                                        return (
                                            <tr key={row.siparisID} className={`hover:bg-gray-50 dark:hover:bg-[#0b1220] ${selected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                <td className="font-semibold">#{row.siparisID}</td>
                                                <td>{row.ciftciFirmaAdi ?? row.olusturanFirmaID}</td>
                                                <td className="min-w-[220px]">
                                                    <div className="font-semibold">{row.yemAdi}</div>
                                                    <div className="text-xs text-white-dark">Yem #{row.yemID}</div>
                                                </td>
                                                <td className="whitespace-nowrap">{Number(row.miktarKg || 0).toLocaleString('tr-TR')} kg</td>
                                                <td className="whitespace-nowrap">{money(row.birimFiyat)}</td>
                                                <td className="whitespace-nowrap font-semibold">{money(row.toplamTutar)}</td>
                                                <td className="whitespace-nowrap">{formatDT(row.siparisTarihi)}</td>
                                                <td className="whitespace-nowrap">
                                                    <span className="badge bg-info">{kaynakText(row.kaynakTipi)}</span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <span className={b.className}>{b.label}</span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <div className="flex gap-2 justify-end">
                                                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openDetay(row)}>
                                                            Detay
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() => {
                                                                setSelectedSiparisID(row.siparisID);
                                                                fetchSevkiyatlar(row.siparisID);
                                                            }}
                                                        >
                                                            Seç
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-primary" type="button" disabled={saving || row.durum !== 'b'} onClick={() => siparisOnayla(row)}>
                                                            Onayla
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" type="button" disabled={saving || row.durum !== 'b'} onClick={() => siparisReddet(row)}>
                                                            Reddet
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-secondary" type="button" disabled={saving || row.durum === 'i' || row.durum === 't'} onClick={() => siparisIptal(row)}>
                                                            İptal
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

            {/* Sevkiyatlar */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">Sevkiyatlar</h5>
                        <div className="text-xs text-white-dark">Seçili Sipariş: <b>{selectedSiparisID ?? '-'}</b></div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-outline-primary"
                            type="button"
                            onClick={() => (selectedSiparisID ? fetchSevkiyatlar(selectedSiparisID) : Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Önce sipariş seç.' }))}
                            disabled={loadingSevkiyat}
                        >
                            {loadingSevkiyat ? 'Yükleniyor...' : 'Yenile'}
                        </button>
                        <button className="btn btn-primary" type="button" disabled={saving || !selectedSiparisID} onClick={sevkiyatOlustur}>
                            Sevkiyat Oluştur
                        </button>
                    </div>
                </div>

                {!selectedSiparisID ? (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-6 shadow-sm text-center text-white-dark">
                        Sevkiyatları görmek için yukarıdan bir sipariş seç.
                    </div>
                ) : sevkiyatlar.length === 0 ? (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-6 shadow-sm text-center text-white-dark">
                        Sevkiyat bulunamadı.
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>SevkiyatID</th>
                                        <th>Sevk Tarihi</th>
                                        <th>Beklenen Teslim</th>
                                        <th>Yem</th>
                                        <th>Miktar</th>
                                        <th>Durum</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sevkiyatlar.map((s) => (
                                        <tr key={s.SevkiyatID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                            <td className="font-semibold">#{s.SevkiyatID}</td>
                                            <td className="whitespace-nowrap">{formatDT(s.SevkTarihi)}</td>
                                            <td className="whitespace-nowrap">{formatDT(s.BeklenenTeslim)}</td>
                                            <td className="min-w-[220px]">
                                                <div className="font-semibold">{s.yemAdi}</div>
                                                <div className="text-xs text-white-dark">Yem #{s.YemID}</div>
                                            </td>
                                            <td className="whitespace-nowrap">{Number(s.MiktarKg || 0).toLocaleString('tr-TR')} kg</td>
                                            <td className="whitespace-nowrap">{s.Durum}</td>
                                            <td className="whitespace-nowrap">
                                                <button className="btn btn-sm btn-outline-danger" type="button" disabled={saving} onClick={() => sevkiyatIptal(s.SevkiyatID)}>
                                                    Sevkiyatı İptal
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TedarikciSiparisYonetimi;
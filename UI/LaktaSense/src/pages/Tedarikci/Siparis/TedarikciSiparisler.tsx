import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Swal from 'sweetalert2';

type SiparisDurum = 'b' | 'o' | 't' | 'r' | 'i' | string;

interface SiparisRow {
    siparisID: number;
    teklifID?: number | null;

    olusturanFirmaID: number; // çiftçi
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
const lastScrollYRef = useRef(0);
const restoringScrollRef = useRef(false); const restoreScrollPosition = () => {
    const y = lastScrollYRef.current;

    // tek sefer yetmeyebiliyor, birkaç frame boyunca geri basıyoruz
    requestAnimationFrame(() => {
        window.scrollTo(0, y);

        requestAnimationFrame(() => {
            window.scrollTo(0, y);

            setTimeout(() => {
                window.scrollTo(0, y);
                restoringScrollRef.current = false;
            }, 60);
        });
    });
};
const API = {
    list: 'http://localhost:3030/api/tedarikci/siparis/postSiparisList',
    approve: 'http://localhost:3030/api/tedarikci/siparis/postSiparisOnay',
    reject: 'http://localhost:3030/api/tedarikci/siparis/postSiparisRed',
    createShipment: 'http://localhost:3030/api/tedarikci/siparis/postSevkiyatOlustur',
    shipments: 'http://localhost:3030/api/tedarikci/siparis/postSevkiyatList',
    shipmentStatus: 'http://localhost:3030/api/tedarikci/siparis/postSevkiyatDurumGuncelle',
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

const kaynakText = (k?: string | null) => {
    if (k === 'ihale') return 'İhale';
    if (k === 'market') return 'Market';
    return k || '-';
};

const badgeSiparis = (d: SiparisDurum) => {
    if (d === 'b') return { className: 'badge bg-warning', label: 'Beklemede' };
    if (d === 'o') return { className: 'badge bg-primary', label: 'Onaylandı' };
    if (d === 't') return { className: 'badge bg-success', label: 'Tamamlandı' };
    if (d === 'r') return { className: 'badge bg-danger', label: 'Reddedildi' };
    if (d === 'i') return { className: 'badge bg-secondary', label: 'İptal' };
    return { className: 'badge bg-secondary', label: String(d ?? '-') };
};

const badgeSevkiyat = (d?: string | null) => {
    if (d === 'h') return { className: 'badge bg-info', label: 'Hazırlıkta' };
    if (d === 'y') return { className: 'badge bg-primary', label: 'Yolda' };
    if (d === 't') return { className: 'badge bg-success', label: 'Teslim Edildi' };
    if (d === 'i') return { className: 'badge bg-danger', label: 'İptal' };
    return { className: 'badge bg-secondary', label: d || '-' };
};

const TedarikciSiparisleri = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const tedarikciID = Number(userInfo?.firmaID ?? userInfo?.tedarikciID ?? 0);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<SiparisRow[]>([]);

    const [view, setView] = useState<'grid' | 'list'>('grid');

    const [arama, setArama] = useState('');
    const [durum, setDurum] = useState<string>('');
    const [kaynak, setKaynak] = useState<string>('');
    const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'tutar_desc' | 'tutar_asc'>('tarih_desc');

    const [selectedSiparisID, setSelectedSiparisID] = useState<number | null>(null);
    const [sevkiyatlar, setSevkiyatlar] = useState<SevkiyatRow[]>([]);
    const [loadingSevkiyat, setLoadingSevkiyat] = useState(false);

    const btnBase = 'btn min-h-[38px] px-3 whitespace-nowrap';
    const btnSm = 'btn btn-sm min-h-[34px] px-3 whitespace-nowrap';
    const statCard =
        'rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-gradient-to-br from-white/70 to-white/40 dark:from-[#0e1726]/70 dark:to-[#0e1726]/40 p-4 shadow-sm';
    const softCard =
        'rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/50 dark:bg-[#0e1726]/50 shadow-sm';
    const innerCard =
        'rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0b1220]/40 p-3';

    useEffect(() => {
        dispatch(setPageTitle('Siparişler (Tedarikçi)'));
    }, [dispatch]);

    const fetchSiparisler = async () => {
        if (!tedarikciID) {
            setRows([]);
            return;
        }
        setLoading(true);
        try {
            const payload: any = {
                tedarikciID,
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

            const onlyMine = arr.filter((x: SiparisRow) => Number(x.tedarikciID) === Number(tedarikciID));
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
            const res = await fetch(API.shipments, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID, tedarikciID }),
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

    const handleSelectSiparis = async (e: React.MouseEvent<HTMLButtonElement>, siparisID: number) => {
        e.preventDefault();
        e.stopPropagation();

        // focus kaynaklı scroll'u engelle
        e.currentTarget.blur();

        // anlık scroll'u sakla
        lastScrollYRef.current = window.scrollY;
        restoringScrollRef.current = true;

        setSelectedSiparisID(siparisID);
        await fetchSevkiyatlar(siparisID);

        restoreScrollPosition();
    };

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
        const tamam = filtered.filter((x) => x.durum === 't').length;
        const iptal = filtered.filter((x) => x.durum === 'i').length;
        const red = filtered.filter((x) => x.durum === 'r').length;
        const toplamCiro = filtered.reduce((p, c) => p + Number(c.toplamTutar || 0), 0);
        return { total, bekleyen, onayli, tamam, iptal, red, toplamCiro };
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
                  <div style="font-weight:900;color:#111827;font-size:16px">${row.yemAdi ?? '-'}</div>
                  <span style="padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:rgba(37,99,235,.12);color:#1d4ed8">
                    ${b.label}
                  </span>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Çiftçi</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${row.ciftciFirmaAdi ?? row.olusturanFirmaID ?? '-'}</div>
                  </div>

                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Kaynak</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${kaynakText(row.kaynakTipi)}</div>
                  </div>

                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Sipariş Tarihi</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${formatDT(row.siparisTarihi)}</div>
                  </div>

                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Yem</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${row.yemAdi} (#${row.yemID})</div>
                  </div>

                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Miktar</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${Number(row.miktarKg || 0).toLocaleString('tr-TR')} kg</div>
                  </div>

                  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
                    <div style="font-size:11px;color:#6b7280;font-weight:900;margin-bottom:4px">Toplam</div>
                    <div style="font-size:13px;color:#111827;font-weight:800">${money(row.toplamTutar)}</div>
                  </div>
                </div>
              </div>
            `,
        });
    };

    const approveSiparis = async (row: SiparisRow) => {
        const ok = await Swal.fire({
            title: 'Siparişi Onayla',
            text: `Sipariş #${row.siparisID} onaylanacak. Devam?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Onayla',
            cancelButtonText: 'Vazgeç',
        });
        if (!ok.isConfirmed) return;

        try {
            const res = await fetch(API.approve, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID: row.siparisID, yapanKullaniciID: userInfo?.kullaniciID }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Sipariş onaylanamadı.');
            await Swal.fire({ icon: 'success', title: 'Onaylandı', timer: 900, showConfirmButton: false });
            fetchSiparisler();
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'Sipariş onaylanamadı.' });
        }
    };

    const rejectSiparis = async (row: SiparisRow) => {
        const ok = await Swal.fire({
            title: 'Siparişi Reddet',
            text: `Sipariş #${row.siparisID} reddedilecek. Emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reddet',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#dc2626',
        });
        if (!ok.isConfirmed) return;

        try {
            const res = await fetch(API.reject, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID: row.siparisID, yapanKullaniciID: userInfo?.kullaniciID }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Sipariş reddedilemedi.');
            await Swal.fire({ icon: 'success', title: 'Reddedildi', timer: 900, showConfirmButton: false });
            fetchSiparisler();
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'Sipariş reddedilemedi.' });
        }
    };

    const createSevkiyat = async (row: SiparisRow) => {
        if (row.durum !== 'o') {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Sevk oluşturmak için sipariş onaylı olmalı.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Sevkiyat Oluştur',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oluştur',
            cancelButtonText: 'Vazgeç',
            html: `
              <div style="text-align:left">
                <div style="margin-bottom:10px;color:#6b7280;font-size:12px">Sipariş #${row.siparisID} • ${row.yemAdi}</div>

                <label style="font-size:12px;font-weight:900;color:#374151">Sevk Tarihi</label>
                <input id="sw-sevk" type="datetime-local" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />

                <label style="font-size:12px;font-weight:900;color:#374151;margin-top:10px;display:block">Beklenen Teslim</label>
                <input id="sw-teslim" type="datetime-local" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />

                <label style="font-size:12px;font-weight:900;color:#374151;margin-top:10px;display:block">Sevk Miktarı (kg)</label>
                <input id="sw-miktar" type="number" min="1" step="0.01" value="${row.miktarKg}" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />

                <label style="font-size:12px;font-weight:900;color:#374151;margin-top:10px;display:block">Yeni Durum *</label>
                <select id="sw-durum" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)">
                  <option value="h">Hazırlıkta</option>
                  <option value="y" selected>Yolda</option>
                  <option value="t">Teslim Edildi</option>
                  <option value="i">İptal</option>
                </select>

                <label style="font-size:12px;font-weight:900;color:#374151;margin-top:10px;display:block">İşlem Nedeni ID</label>
                <input id="sw-neden" type="number" min="1" step="1" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
              </div>
            `,
            didOpen: () => {
                const now = new Date();
                const addHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString().slice(0, 16);
                (document.getElementById('sw-sevk') as HTMLInputElement).value = addHours(2);
                (document.getElementById('sw-teslim') as HTMLInputElement).value = addHours(26);
            },
            preConfirm: () => {
                const sevk = (document.getElementById('sw-sevk') as HTMLInputElement)?.value;
                const teslim = (document.getElementById('sw-teslim') as HTMLInputElement)?.value;
                const miktar = Number((document.getElementById('sw-miktar') as HTMLInputElement)?.value);
                const durum = (document.getElementById('sw-durum') as HTMLSelectElement)?.value;
                const neden = (document.getElementById('sw-neden') as HTMLInputElement)?.value;

                if (!sevk || !teslim) {
                    Swal.showValidationMessage('Sevk ve beklenen teslim tarihleri zorunlu.');
                    return;
                }
                if (!Number.isFinite(miktar) || miktar <= 0) {
                    Swal.showValidationMessage('Geçerli bir miktar girin.');
                    return;
                }
                if (!durum) {
                    Swal.showValidationMessage('Durum seçimi zorunlu.');
                    return;
                }

                return {
                    sevk,
                    teslim,
                    miktar,
                    durum,
                    neden: neden ? Number(neden) : undefined,
                };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        try {
            const res = await fetch(API.createShipment, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siparisID: row.siparisID,
                    sevkTarihi: result.value.sevk,
                    beklenenTeslim: result.value.teslim,
                    miktarKg: result.value.miktar,
                    durum: result.value.durum,
                    kullaniciID: userInfo?.kullaniciID,
                    islemNedeniIDSevk: result.value.neden,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Sevkiyat oluşturulamadı.');
            await Swal.fire({ icon: 'success', title: 'Sevkiyat oluşturuldu', timer: 1200, showConfirmButton: false });
            fetchSevkiyatlar(row.siparisID);
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'Sevkiyat oluşturulamadı.' });
        }
    };

    const updateSevkiyatDurum = async (sevkiyat: SevkiyatRow) => {
        const result = await Swal.fire({
            title: `Sevkiyat #${sevkiyat.SevkiyatID}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            cancelButtonText: 'Vazgeç',
            html: `
              <div style="text-align:left">
                <label style="font-size:12px;font-weight:900;color:#374151">Yeni Durum</label>
                <select id="sw-sevkiyat-durum" style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)">
                  <option value="h" ${sevkiyat.Durum === 'h' ? 'selected' : ''}>Hazırlıkta</option>
                  <option value="y" ${sevkiyat.Durum === 'y' ? 'selected' : ''}>Yolda</option>
                  <option value="t" ${sevkiyat.Durum === 't' ? 'selected' : ''}>Teslim Edildi</option>
                  <option value="i" ${sevkiyat.Durum === 'i' ? 'selected' : ''}>İptal</option>
                </select>
              </div>
            `,
            preConfirm: () => {
                const yeniDurum = (document.getElementById('sw-sevkiyat-durum') as HTMLSelectElement)?.value;
                if (!yeniDurum) {
                    Swal.showValidationMessage('Durum seçiniz.');
                    return;
                }
                return { yeniDurum };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        try {
            const res = await fetch(API.shipmentStatus, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sevkiyatID: sevkiyat.SevkiyatID,
                    yeniDurum: result.value.yeniDurum,
                    yapanKullaniciID: userInfo?.kullaniciID,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Sevkiyat durumu güncellenemedi.');
            await Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 900, showConfirmButton: false });
            if (selectedSiparisID) fetchSevkiyatlar(selectedSiparisID);
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'Sevkiyat durumu güncellenemedi.' });
        }
    };

    const OrderCard = ({ row }: { row: SiparisRow }) => {
        const b = badgeSiparis(row.durum);
        const selected = selectedSiparisID === row.siparisID;

        return (
            <div
                className={`rounded-2xl border transition-all duration-200 p-5 shadow-sm hover:shadow-md ${selected
                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/30'
                    : 'border-white-light dark:border-[#1b2e4b] bg-white/50 dark:bg-[#0e1726]/50'
                    }`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold truncate">{row.yemAdi}</div>
                            <span className={b.className}>{b.label}</span>
                            <span className="badge bg-info">{kaynakText(row.kaynakTipi)}</span>
                        </div>
                        <div className="mt-2 text-xs text-white-dark">
                            Çiftçi: <span className="font-semibold text-dark dark:text-white-light">{row.ciftciFirmaAdi ?? row.olusturanFirmaID}</span>
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <div className="text-[11px] uppercase tracking-wide text-white-dark">Sipariş</div>
                        <div className="text-sm font-bold">#{row.siparisID}</div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={innerCard}>
                        <div className="text-xs text-white-dark">Miktar</div>
                        <div className="mt-1 text-lg font-semibold">{Number(row.miktarKg || 0).toLocaleString('tr-TR')} kg</div>
                    </div>
                    <div className={innerCard}>
                        <div className="text-xs text-white-dark">Birim Fiyat</div>
                        <div className="mt-1 text-lg font-semibold">{money(row.birimFiyat)}</div>
                    </div>
                    <div className={innerCard}>
                        <div className="text-xs text-white-dark">Toplam Tutar</div>
                        <div className="mt-1 text-lg font-semibold">{money(row.toplamTutar)}</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <div className="text-xs text-white-dark">
                        Sipariş Tarihi: <span className="font-semibold text-dark dark:text-white-light">{formatDT(row.siparisTarihi)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={`${btnBase} btn-outline-secondary`} onClick={() => openDetay(row)}>
                            Detay
                        </button>
                        <button
                            type="button"
                            className={`${btnBase} btn-outline-primary`}
                            onClick={(e) => handleSelectSiparis(e, row.siparisID)}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            Seç
                        </button>

                        {row.durum === 'b' && (
                            <>
                                <button type="button" className={`${btnBase} btn-success`} onClick={() => approveSiparis(row)}>
                                    Onayla
                                </button>
                                <button type="button" className={`${btnBase} btn-danger`} onClick={() => rejectSiparis(row)}>
                                    Reddet
                                </button>
                            </>
                        )}

                        {row.durum === 'o' && (
                            <button type="button" className={`${btnBase} btn-info`} onClick={() => createSevkiyat(row)}>
                                Sevk Oluştur
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h5 className="text-xl font-semibold">Siparişler (Tedarikçi)</h5>
                        <p className="mt-1 text-sm text-white-dark">
                            Çiftçilerden gelen siparişleri görüntüle, filtrele ve siparişe bağlı sevkiyatları takip et.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button className={`${btnBase} btn-outline-primary`} onClick={fetchSiparisler} disabled={loading}>
                            {loading ? 'Yükleniyor...' : 'Yenile'}
                        </button>

                        <div className="flex items-center overflow-hidden rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40">
                            <button
                                className={`min-w-[88px] px-4 py-2.5 text-sm font-medium transition ${view === 'grid' ? 'bg-primary text-white' : 'text-dark dark:text-white-light'}`}
                                onClick={() => setView('grid')}
                                type="button"
                            >
                                Grid
                            </button>
                            <button
                                className={`min-w-[88px] px-4 py-2.5 text-sm font-medium transition ${view === 'list' ? 'bg-primary text-white' : 'text-dark dark:text-white-light'}`}
                                onClick={() => setView('list')}
                                type="button"
                            >
                                Liste
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
                <div className={statCard}>
                    <div className="text-xs text-white-dark">Toplam</div>
                    <div className="mt-1 text-2xl font-bold">{kpi.total}</div>
                </div>
                <div className={statCard}>
                    <div className="text-xs text-white-dark">Bekleyen</div>
                    <div className="mt-1 text-2xl font-bold">{kpi.bekleyen}</div>
                </div>
                <div className={statCard}>
                    <div className="text-xs text-white-dark">Onaylı</div>
                    <div className="mt-1 text-2xl font-bold">{kpi.onayli}</div>
                </div>
                <div className={statCard}>
                    <div className="text-xs text-white-dark">Tamam</div>
                    <div className="mt-1 text-2xl font-bold">{kpi.tamam}</div>
                </div>
                <div className={statCard}>
                    <div className="text-xs text-white-dark">İptal</div>
                    <div className="mt-1 text-2xl font-bold">{kpi.iptal}</div>
                </div>
                <div className={statCard}>
                    <div className="text-xs text-white-dark">Ciro</div>
                    <div className="mt-1 text-2xl font-bold">{money(kpi.toplamCiro)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h6 className="font-semibold">Filtreler</h6>
                    <div className="text-xs text-white-dark">
                        Gösterilen: <b>{filtered.length}</b> • Seçili Sipariş: <b>{selectedSiparisID ?? '-'}</b>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className={innerCard}>
                        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Arama')}</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Sipariş / çiftçi / yem" />
                    </div>

                    <div className={innerCard}>
                        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Durum')}</label>
                        <select className="form-select w-full" value={durum} onChange={(e) => setDurum(e.target.value)}>
                            <option value="">{t('Hepsi')}</option>
                            <option value="b">{t('Beklemede')}</option>
                            <option value="o">{t('Onaylandı')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="r">{t('Reddedildi')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                    </div>

                    <div className={innerCard}>
                        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Kaynak')}</label>
                        <select className="form-select w-full" value={kaynak} onChange={(e) => setKaynak(e.target.value)}>
                            <option value="">{t('Hepsi')}</option>
                            <option value="market">{t('Market')}</option>
                            <option value="ihale">{t('İhale')}</option>
                        </select>
                    </div>

                    <div className={innerCard}>
                        <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Sıralama')}</label>
                        <select className="form-select w-full" value={siralama} onChange={(e) => setSiralama(e.target.value as any)}>
                            <option value="tarih_desc">{t('Tarih (Yeni)')}</option>
                            <option value="tarih_asc">{t('Tarih (Eski)')}</option>
                            <option value="tutar_desc">{t('Tutar (Azalan)')}</option>
                            <option value="tutar_asc">{t('Tutar (Artan)')}</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                        className={`${btnBase} btn-outline-secondary`}
                        type="button"
                        onClick={() => {
                            setArama('');
                            setDurum('');
                            setKaynak('');
                            setSiralama('tarih_desc');
                        }}
                    >
                        {t('Temizle')}
                    </button>
                    <button className={`${btnBase} btn-primary`} type="button" onClick={fetchSiparisler} disabled={loading}>
                        {loading ? t('Yükleniyor...') : t('Uygula')}
                    </button>
                </div>
            </div>

            {/* Orders */}
            <div className="panel p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h5 className="text-lg font-semibold">{t('Siparişler')}</h5>
                    <div className="text-xs text-white-dark">
                        {t('Gösterilen')}: <b>{filtered.length}</b>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className={`${softCard} p-10 text-center text-white-dark`}>{t('Kayıt bulunamadı')}</div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {filtered.map((row) => (
                            <OrderCard key={row.siparisID} row={row} />
                        ))}
                    </div>
                ) : (
                    <div className={`${softCard} overflow-hidden`}>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('SiparişID')}</th>
                                        <th>{t('Çiftçi')}</th>
                                        <th>{t('Yem')}</th>
                                        <th>{t('Miktar')}</th>
                                        <th>{t('Toplam')}</th>
                                        <th>{t('Tarih')}</th>
                                        <th>{t('Kaynak')}</th>
                                        <th>{t('Durum')}</th>
                                        <th className="text-right">{t('İşlem')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => {
                                        const b = badgeSiparis(row.durum);
                                        const selected = selectedSiparisID === row.siparisID;

                                        return (
                                            <tr key={row.siparisID} className={`hover:bg-gray-50 dark:hover:bg-[#0b1220] ${selected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                <td className="font-semibold">#{row.siparisID}</td>
                                                <td>
                                                    <div className="font-semibold">{row.ciftciFirmaAdi ?? row.olusturanFirmaID}</div>
                                                </td>
                                                <td className="min-w-[220px]">
                                                    <div className="font-semibold">{row.yemAdi}</div>
                                                    <div className="text-xs text-white-dark">Yem #{row.yemID}</div>
                                                </td>
                                                <td className="whitespace-nowrap">{Number(row.miktarKg || 0).toLocaleString('tr-TR')} kg</td>
                                                <td className="whitespace-nowrap font-semibold">{money(row.toplamTutar)}</td>
                                                <td className="whitespace-nowrap">{formatDT(row.siparisTarihi)}</td>
                                                <td className="whitespace-nowrap">
                                                    <span className="badge bg-info">{kaynakText(row.kaynakTipi)}</span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <span className={b.className}>{b.label}</span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <div className="flex flex-wrap justify-end gap-2 min-w-[340px]">
                                                        <button className={`${btnSm} btn-outline-secondary`} type="button" onClick={() => openDetay(row)}>
                                                            {t('Detay')}
                                                        </button>
                                                        <button
                                                            className={`${btnSm} btn-outline-primary`}
                                                            type="button"
                                                            onClick={(e) => handleSelectSiparis(e, row.siparisID)}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                        >
                                                            {t('Seç')}
                                                        </button>
                                                        {row.durum === 'b' && (
                                                            <>
                                                                <button className={`${btnSm} btn-success`} type="button" onClick={() => approveSiparis(row)}>
                                                                    {t('Onayla')}
                                                                </button>
                                                                <button className={`${btnSm} btn-danger`} type="button" onClick={() => rejectSiparis(row)}>
                                                                    {t('Reddet')}
                                                                </button>
                                                            </>
                                                        )}
                                                        {row.durum === 'o' && (
                                                            <button className={`${btnSm} btn-info`} type="button" onClick={() => createSevkiyat(row)}>
                                                                {t('Sevk Oluştur')}
                                                            </button>
                                                        )}
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
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Sevkiyatlar')}</h5>
                        <div className="text-xs text-white-dark">
                            {t('Seçili Sipariş')}: <b>{selectedSiparisID ?? '-'}</b>
                        </div>
                    </div>

                    <button
                        className={`${btnBase} btn-outline-primary`}
                        type="button"
                        onClick={() => (selectedSiparisID ? fetchSevkiyatlar(selectedSiparisID) : Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Önce sipariş seç.' }))}
                        disabled={loadingSevkiyat}
                    >
                        {loadingSevkiyat ? t('Yükleniyor...') : t('Yenile')}
                    </button>
                </div>

                {!selectedSiparisID ? (
                    <div className={`${softCard} p-10 text-center text-white-dark`}>
                        {t('Sevkiyatları görmek için yukarıdan bir sipariş seçin.')}
                    </div>
                ) : sevkiyatlar.length === 0 ? (
                    <div className={`${softCard} p-10 text-center text-white-dark`}>{t('Kayıt bulunamadı')}</div>
                ) : (
                    <div className={`${softCard} overflow-hidden`}>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('SevkiyatID')}</th>
                                        <th>{t('Sevk Tarihi')}</th>
                                        <th>{t('Beklenen Teslim')}</th>
                                        <th>{t('Yem')}</th>
                                        <th>{t('Miktar')}</th>
                                        <th>{t('Durum')}</th>
                                        <th className="text-right">{t('İşlem')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sevkiyatlar.map((s) => {
                                        const sevkBadge = badgeSevkiyat(s.Durum);

                                        return (
                                            <tr key={s.SevkiyatID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                                <td className="font-semibold">#{s.SevkiyatID}</td>
                                                <td className="whitespace-nowrap">{formatDT(s.SevkTarihi)}</td>
                                                <td className="whitespace-nowrap">{formatDT(s.BeklenenTeslim)}</td>
                                                <td className="min-w-[220px]">
                                                    <div className="font-semibold">{s.yemAdi}</div>
                                                    <div className="text-xs text-white-dark">Yem #{s.YemID}</div>
                                                </td>
                                                <td className="whitespace-nowrap">{Number(s.MiktarKg || 0).toLocaleString('tr-TR')} kg</td>
                                                <td className="whitespace-nowrap">
                                                    <span className={sevkBadge.className}>{sevkBadge.label}</span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <div className="flex justify-end">
                                                        <button className={`${btnSm} btn-outline-primary`} type="button" onClick={() => updateSevkiyatDurum(s)}>
                                                            {t('Durum')}
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
        </div>
    );
};

export default TedarikciSiparisleri;
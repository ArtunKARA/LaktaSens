import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Swal from 'sweetalert2';

type TeklifDurum = 'aktif' | 'kazanildi' | 'kaybedildi' | 'iptal' | 'geri_cekildi';

// ✅ “İhalelerim” altında gördüğün alt menüler = işlem/sipariş akışı
type IslemDurum =
    | 'bekleyen_onay'
    | 'hazirlanan'
    | 'sevk_edilen'
    | 'tamamlanan'
    | 'iptal_edilen'
    | 'iade_talepleri';

type TabKey = 'hepsi' | IslemDurum;

const TABs: { key: TabKey; label: string; tone: 'primary' | 'warning' | 'info' | 'success' | 'danger' | 'secondary' | 'neutral' }[] = [
    { key: 'hepsi', label: 'Hepsi', tone: 'neutral' },
    { key: 'bekleyen_onay', label: 'Bekleyen Onay', tone: 'warning' },
    { key: 'hazirlanan', label: 'Hazırlanan Siparişler', tone: 'info' },
    { key: 'sevk_edilen', label: 'Sevk Edilen', tone: 'primary' },
    { key: 'tamamlanan', label: 'Tamamlanan', tone: 'success' },
    { key: 'iptal_edilen', label: 'İptal Edilen', tone: 'danger' },
    { key: 'iade_talepleri', label: 'İade Talepleri', tone: 'secondary' },
];

const toneBadge = (tone: (typeof TABs)[number]['tone']) => {
    if (tone === 'primary') return 'bg-primary';
    if (tone === 'warning') return 'bg-warning';
    if (tone === 'info') return 'bg-info';
    if (tone === 'success') return 'bg-success';
    if (tone === 'danger') return 'bg-danger';
    if (tone === 'secondary') return 'bg-secondary';
    return 'bg-dark';
};

interface IhalemRow {
    teklifID: number;
    ihaleID: number;

    ihaleAdi: string;
    acanFirmaAdi: string;
    yemAdi: string;

    ihaleBaslangicTarihi: string;
    ihaleBitisTarihi: string;

    talepMiktarKg: number;
    kalanMiktarKg: number;

    benimTeklifBirimFiyat: number;
    benimTeklifMiktarKg: number;
    benimTeklifTarihi: string;

    enDusukBirimFiyat?: number | null;
    teklifSayisi?: number | null;

    teklifDurum: TeklifDurum;
    sonucAciklama?: string | null;

    // ✅ yeni: “İhalelerim” altındaki sekmelere göre filtre
    // API gelene kadar backend doldurmayacak -> default hepsi gibi davranacağız
    islemDurum?: IslemDurum | null;

    // opsiyonel (ileride lazım olur)
    siparisNo?: string | null;
    sevkNo?: string | null;
    iadeNo?: string | null;
}

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

const badgeTeklif = (d: TeklifDurum) => {
    switch (d) {
        case 'aktif':
            return { className: 'badge bg-success', label: 'Aktif' };
        case 'kazanildi':
            return { className: 'badge bg-primary', label: 'Kazanıldı' };
        case 'kaybedildi':
            return { className: 'badge bg-warning', label: 'Kaybedildi' };
        case 'iptal':
            return { className: 'badge bg-danger', label: 'İptal' };
        case 'geri_cekildi':
            return { className: 'badge bg-secondary', label: 'Geri Çekildi' };
        default:
            return { className: 'badge bg-secondary', label: 'Bilinmiyor' };
    }
};

// ✅ burada sadece endpointleri düzelt
const API = {
    list: 'http://localhost:3030/api/tedarikci/ihale/postIhalelerimList',
    update: 'http://localhost:3030/api/tedarikci/ihale/postTeklifGuncelle',
    cancel: 'http://localhost:3030/api/tedarikci/ihale/postTeklifIptal',
    detail: 'http://localhost:3030/api/tedarikci/ihale/postIhaleDetay',
};

const Ihalelerim = () => {
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [rows, setRows] = useState<IhalemRow[]>([]);

    // ✅ yeni: üst sekmeler (menüdeki alt başlıklar)
    const [activeTab, setActiveTab] = useState<TabKey>('hepsi');

    // filtreler
    const [arama, setArama] = useState('');
    const [durum, setDurum] = useState<TeklifDurum | 'hepsi'>('hepsi');
    const [minFiyat, setMinFiyat] = useState('');
    const [maxFiyat, setMaxFiyat] = useState('');
    const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'fiyat_asc' | 'fiyat_desc' | 'bitis_asc'>('tarih_desc');

    const [view, setView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        dispatch(setPageTitle('İhalelerim'));
    }, [dispatch]);

    const fetchIhalelerim = async () => {
        setLoading(true);
        try {
            const payload = {
                tedarikciFirmaID: userInfo?.firmaID || userInfo?.tedarikciID,
                arama: arama || undefined,
                durum: durum === 'hepsi' ? undefined : durum,
                minFiyat: minFiyat ? Number(minFiyat) : undefined,
                maxFiyat: maxFiyat ? Number(maxFiyat) : undefined,
                siralama,
                // ✅ API hazır olunca istersen backend tarafında da filtrelersin:
                // islemDurum: activeTab === 'hepsi' ? undefined : activeTab,
            };

            const res = await fetch(API.list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            // ✅ API gelmeyince boş da gelebilir
            const arr: IhalemRow[] = Array.isArray(data) ? data : [];

            setRows(arr);
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'İhalelerim alınamadı.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIhalelerim();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const a = arama.trim().toLowerCase();

        return rows
            .filter((x) => {
                const okA = !a || `${x.ihaleAdi} ${x.acanFirmaAdi} ${x.yemAdi}`.toLowerCase().includes(a);

                const okD = durum === 'hepsi' || x.teklifDurum === durum;

                // ✅ sekmeye göre filtre:
                // islemDurum yoksa (API yokken) kayıt sekmelerde kaybolmasın diye “hepsi” gibi davranır.
                const rowTab = x.islemDurum ?? null;
                const okTab = activeTab === 'hepsi' ? true : rowTab === activeTab;

                const pf = Number(x.benimTeklifBirimFiyat || 0);
                const okMin = !minFiyat || pf >= Number(minFiyat);
                const okMax = !maxFiyat || pf <= Number(maxFiyat);

                return okA && okD && okTab && okMin && okMax;
            })
            .sort((a, b) => {
                if (siralama === 'tarih_desc') return +new Date(b.benimTeklifTarihi) - +new Date(a.benimTeklifTarihi);
                if (siralama === 'tarih_asc') return +new Date(a.benimTeklifTarihi) - +new Date(b.benimTeklifTarihi);
                if (siralama === 'fiyat_asc') return (a.benimTeklifBirimFiyat ?? 0) - (b.benimTeklifBirimFiyat ?? 0);
                if (siralama === 'fiyat_desc') return (b.benimTeklifBirimFiyat ?? 0) - (a.benimTeklifBirimFiyat ?? 0);
                if (siralama === 'bitis_asc') return +new Date(a.ihaleBitisTarihi) - +new Date(b.ihaleBitisTarihi);
                return 0;
            });
    }, [rows, arama, durum, minFiyat, maxFiyat, siralama, activeTab]);

    // ✅ KPI’yı hem teklif durumundan hem tab durumundan gösteriyoruz
    const kpi = useMemo(() => {
        const total = rows.length;

        const aktif = rows.filter((x) => x.teklifDurum === 'aktif').length;
        const kazan = rows.filter((x) => x.teklifDurum === 'kazanildi').length;
        const kaybet = rows.filter((x) => x.teklifDurum === 'kaybedildi').length;

        const countTab = (d: IslemDurum) => rows.filter((x) => (x.islemDurum ?? null) === d).length;

        const avg = (() => {
            const arr = rows.map((x) => Number(x.benimTeklifBirimFiyat)).filter((n) => Number.isFinite(n) && n > 0);
            if (!arr.length) return null;
            return Math.round((arr.reduce((p, c) => p + c, 0) / arr.length) * 100) / 100;
        })();

        return {
            total,
            aktif,
            kazan,
            kaybet,
            avg,
            bekleyen: countTab('bekleyen_onay'),
            hazirlanan: countTab('hazirlanan'),
            sevk: countTab('sevk_edilen'),
            tamam: countTab('tamamlanan'),
            iptal: countTab('iptal_edilen'),
            iade: countTab('iade_talepleri'),
        };
    }, [rows]);

    const openDetay = async (row: IhalemRow) => {
        const b = badgeTeklif(row.teklifDurum);

        const tabLabel =
            row.islemDurum
                ? TABs.find((t) => t.key === row.islemDurum)?.label ?? '-'
                : '-';

        await Swal.fire({
            title: `Detay • İhale #${row.ihaleID}`,
            icon: 'info',
            width: 760,
            confirmButtonText: 'Kapat',
            html: `
              <div style="text-align:left">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
                  <div style="font-weight:900;color:#111827;font-size:16px">${escapeHtml(row.ihaleAdi)}</div>
                  <span style="padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(37,99,235,.12);color:#1d4ed8">
                    ${escapeHtml(b.label)}
                  </span>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  ${infoRow('Açan Firma', row.acanFirmaAdi)}
                  ${infoRow('Yem', row.yemAdi)}
                  ${infoRow('İhale Başlangıç', formatDT(row.ihaleBaslangicTarihi))}
                  ${infoRow('İhale Bitiş', formatDT(row.ihaleBitisTarihi))}
                  ${infoRow('Talep (kg)', Number(row.talepMiktarKg || 0).toLocaleString('tr-TR'))}
                  ${infoRow('Kalan (kg)', Number(row.kalanMiktarKg || 0).toLocaleString('tr-TR'))}
                  ${infoRow('Benim Fiyat', money(row.benimTeklifBirimFiyat))}
                  ${infoRow('Benim Miktar (kg)', Number(row.benimTeklifMiktarKg || 0).toLocaleString('tr-TR'))}
                  ${infoRow('Teklif Tarihim', formatDT(row.benimTeklifTarihi))}
                  ${infoRow('En Düşük', row.enDusukBirimFiyat != null ? money(row.enDusukBirimFiyat) : '-')}
                  ${infoRow('İşlem Durumu', tabLabel)}
                  ${row.siparisNo ? infoRow('Sipariş No', row.siparisNo) : ''}
                  ${row.sevkNo ? infoRow('Sevk No', row.sevkNo) : ''}
                  ${row.iadeNo ? infoRow('İade No', row.iadeNo) : ''}
                </div>

                ${row.sonucAciklama ? `
                  <div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06)">
                    <div style="font-size:11px;color:#6b7280;font-weight:800;margin-bottom:6px">Sonuç Notu</div>
                    <div style="font-size:13px;color:#111827;line-height:1.5">${escapeHtml(row.sonucAciklama)}</div>
                  </div>
                ` : ''}
              </div>
            `,
        });
    };

    const teklifGuncelle = async (row: IhalemRow) => {
        if (row.teklifDurum !== 'aktif') {
            Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Sadece aktif teklif güncellenebilir.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Teklifi Güncelle',
            width: 720,
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            html: `
              <div style="text-align:left">
                <div style="margin-bottom:10px;color:#6b7280;font-size:12px">${escapeHtml(row.ihaleAdi)} • ${escapeHtml(row.yemAdi)}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div>
                    <label style="font-size:12px;font-weight:800;color:#374151">Birim Fiyat *</label>
                    <input id="sw-f" type="number" step="0.01" min="0"
                      value="${String(row.benimTeklifBirimFiyat ?? '')}"
                      style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:800;color:#374151">Miktar (kg) *</label>
                    <input id="sw-m" type="number" step="1" min="0"
                      value="${String(row.benimTeklifMiktarKg ?? '')}"
                      style="margin-top:6px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.15)" />
                  </div>
                </div>
              </div>
            `,
            preConfirm: () => {
                const f = Number((document.getElementById('sw-f') as HTMLInputElement)?.value);
                const m = Number((document.getElementById('sw-m') as HTMLInputElement)?.value);

                const limit = Number(row.kalanMiktarKg || row.talepMiktarKg || 0);

                if (!Number.isFinite(f) || f <= 0) {
                    Swal.showValidationMessage('Birim fiyat 0’dan büyük olmalı.');
                    return;
                }
                if (!Number.isFinite(m) || m <= 0) {
                    Swal.showValidationMessage('Miktar 0’dan büyük olmalı.');
                    return;
                }
                if (m > limit) {
                    Swal.showValidationMessage('Miktar, kalan/talep miktarından büyük olamaz.');
                    return;
                }
                return { f, m };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        setSaving(true);
        try {
            const payload = {
                teklifID: row.teklifID,
                tedarikciFirmaID: userInfo?.firmaID || userInfo?.tedarikciID,
                birimFiyat: Number(result.value.f),
                miktarKg: Number(result.value.m),
                yapanKullaniciID: userInfo?.kullaniciID,
            };

            const res = await fetch(API.update, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const txt = await res.text();
            if (!res.ok) throw new Error(txt || 'Teklif güncellenemedi');

            Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 1000, showConfirmButton: false });
            fetchIhalelerim();
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'Teklif güncellenemedi.' });
        } finally {
            setSaving(false);
        }
    };

    const teklifIptal = async (row: IhalemRow) => {
        const confirm = await Swal.fire({
            title: 'Teklifi geri çekmek istiyor musunuz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#dc2626',
        });

        if (!confirm.isConfirmed) return;

        setSaving(true);
        try {
            const payload = {
                teklifID: row.teklifID,
                tedarikciFirmaID: userInfo?.firmaID || userInfo?.tedarikciID,
                yapanKullaniciID: userInfo?.kullaniciID,
            };

            const res = await fetch(API.cancel, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const txt = await res.text();
            if (!res.ok) throw new Error(txt || 'Teklif iptal edilemedi');

            Swal.fire({ icon: 'success', title: 'Geri çekildi', timer: 1000, showConfirmButton: false });
            fetchIhalelerim();
        } catch (e: any) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Hata', text: e?.message ?? 'İşlem başarısız.' });
        } finally {
            setSaving(false);
        }
    };

    const IhaleCard = ({ row }: { row: IhalemRow }) => {
        const b = badgeTeklif(row.teklifDurum);
        const tabLabel = row.islemDurum ? (TABs.find((t) => t.key === row.islemDurum)?.label ?? '-') : null;

        return (
            <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 shadow-sm hover:shadow-md transition p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold truncate">{row.ihaleAdi}</div>
                            <span className={b.className}>{b.label}</span>
                            {tabLabel ? <span className="badge bg-dark/20 text-black dark:text-white">{tabLabel}</span> : null}
                        </div>
                        <div className="text-xs text-white-dark mt-1 truncate">
                            {row.acanFirmaAdi} • {row.yemAdi}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-white-dark">Bitiş</div>
                        <div className="text-sm font-semibold">{formatDT(row.ihaleBitisTarihi)}</div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Benim Fiyat</div>
                        <div className="text-lg font-semibold">{money(row.benimTeklifBirimFiyat)}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Benim Miktar</div>
                        <div className="text-lg font-semibold">{Number(row.benimTeklifMiktarKg || 0).toLocaleString('tr-TR')} kg</div>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Teklif Tarihim</div>
                        <div className="font-semibold">{formatDT(row.benimTeklifTarihi)}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">En Düşük</div>
                        <div className="font-semibold">{row.enDusukBirimFiyat != null ? money(row.enDusukBirimFiyat) : '-'}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/30 dark:bg-[#0b1220]/30 p-3">
                        <div className="text-xs text-white-dark">Teklif Sayısı</div>
                        <div className="font-semibold">{row.teklifSayisi ?? 0}</div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => openDetay(row)}>
                        Detay
                    </button>
                    <button type="button" className="btn btn-outline-primary" disabled={saving || row.teklifDurum !== 'aktif'} onClick={() => teklifGuncelle(row)}>
                        Teklifimi Güncelle
                    </button>
                    <button type="button" className="btn btn-outline-danger" disabled={saving || row.teklifDurum !== 'aktif'} onClick={() => teklifIptal(row)}>
                        Geri Çek
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
                        <h5 className="text-lg font-semibold">İhalelerim</h5>
                        <p className="text-sm text-white-dark mt-1">Verdiğin teklifleri ve süreçteki kayıtları tek ekranda yönet.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchIhalelerim} disabled={loading}>
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

                {/* ✅ Sekmeler (sol menüdeki alt başlıklar) */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {TABs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const count =
                            tab.key === 'hepsi'
                                ? kpi.total
                                : tab.key === 'bekleyen_onay'
                                    ? kpi.bekleyen
                                    : tab.key === 'hazirlanan'
                                        ? kpi.hazirlanan
                                        : tab.key === 'sevk_edilen'
                                            ? kpi.sevk
                                            : tab.key === 'tamamlanan'
                                                ? kpi.tamam
                                                : tab.key === 'iptal_edilen'
                                                    ? kpi.iptal
                                                    : kpi.iade;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-xl border px-3 py-2 text-sm flex items-center gap-2 transition
                                    ${isActive ? 'border-primary bg-primary text-white' : 'border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40'}
                                `}
                            >
                                <span className="font-semibold">{tab.label}</span>
                                <span className={`badge ${isActive ? 'bg-white/20 text-white' : toneBadge(tab.tone)}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters + KPI */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h6 className="font-semibold">Filtreler</h6>
                    <div className="text-xs text-white-dark">
                        Toplam: <b>{kpi.total}</b> • Aktif Teklif: <b>{kpi.aktif}</b> • Kazanılan: <b>{kpi.kazan}</b> • Kaybedilen: <b>{kpi.kaybet}</b> • Ortalama Fiyat: <b>{kpi.avg ?? '-'}</b>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Arama</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="İhale / firma / yem" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Teklif Durumu</label>
                        <select className="form-select w-full" value={durum} onChange={(e) => setDurum(e.target.value as any)}>
                            <option value="hepsi">Hepsi</option>
                            <option value="aktif">Aktif</option>
                            <option value="kazanildi">Kazanıldı</option>
                            <option value="kaybedildi">Kaybedildi</option>
                            <option value="iptal">İptal</option>
                            <option value="geri_cekildi">Geri Çekildi</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Min Fiyat</label>
                        <input type="number" className="form-input w-full" value={minFiyat} onChange={(e) => setMinFiyat(e.target.value)} placeholder="0" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Max Fiyat</label>
                        <input type="number" className="form-input w-full" value={maxFiyat} onChange={(e) => setMaxFiyat(e.target.value)} placeholder="-" />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">Sıralama</label>
                        <select className="form-select w-full" value={siralama} onChange={(e) => setSiralama(e.target.value as any)}>
                            <option value="tarih_desc">Teklif Tarihi (Yeni)</option>
                            <option value="tarih_asc">Teklif Tarihi (Eski)</option>
                            <option value="fiyat_asc">Fiyat (Artan)</option>
                            <option value="fiyat_desc">Fiyat (Azalan)</option>
                            <option value="bitis_asc">İhale Bitiş (Yakın)</option>
                        </select>
                    </div>

                    <div className="md:col-span-3 flex items-center justify-end gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => {
                                setArama('');
                                setDurum('hepsi');
                                setMinFiyat('');
                                setMaxFiyat('');
                                setSiralama('tarih_desc');
                                setActiveTab('hepsi');
                            }}
                        >
                            Temizle
                        </button>
                        <button className="btn btn-primary" type="button" onClick={fetchIhalelerim} disabled={loading}>
                            {loading ? 'Yükleniyor...' : 'Uygula'}
                        </button>
                    </div>
                </div>
            </div>

            {/* List/Grid */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">Kayıt Listesi</h5>
                    <div className="text-xs text-white-dark">
                        Sekme: <b>{TABs.find((t) => t.key === activeTab)?.label}</b> • Gösterilen: <b>{filtered.length}</b>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-6 shadow-sm text-center text-white-dark">
                        {rows.length === 0 ? 'Henüz veri yok (API hazır olunca burada dolacak).' : 'Bu sekmede kayıt bulunamadı.'}
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((row) => (
                            <IhaleCard key={row.teklifID} row={row} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>TeklifID</th>
                                        <th>İhale</th>
                                        <th>Firma</th>
                                        <th>Yem</th>
                                        <th>Benim Fiyat</th>
                                        <th>Benim Miktar</th>
                                        <th>Teklif Tarihi</th>
                                        <th>Teklif Durumu</th>
                                        <th>İşlem Durumu</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => {
                                        const b = badgeTeklif(row.teklifDurum);
                                        const tabLabel = row.islemDurum ? (TABs.find((t) => t.key === row.islemDurum)?.label ?? '-') : '-';

                                        return (
                                            <tr key={row.teklifID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                                <td className="font-semibold">{row.teklifID}</td>
                                                <td className="min-w-[220px]">
                                                    <div className="font-semibold">{row.ihaleAdi}</div>
                                                    <div className="text-xs text-white-dark">İhale #{row.ihaleID} • Bitiş: {formatDT(row.ihaleBitisTarihi)}</div>
                                                </td>
                                                <td>{row.acanFirmaAdi}</td>
                                                <td>{row.yemAdi}</td>
                                                <td className="whitespace-nowrap">{money(row.benimTeklifBirimFiyat)}</td>
                                                <td className="whitespace-nowrap">{Number(row.benimTeklifMiktarKg || 0).toLocaleString('tr-TR')} kg</td>
                                                <td className="whitespace-nowrap">{formatDT(row.benimTeklifTarihi)}</td>
                                                <td className="whitespace-nowrap">
                                                    <span className={b.className}>{b.label}</span>
                                                </td>
                                                <td className="whitespace-nowrap">{tabLabel}</td>
                                                <td className="whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openDetay(row)}>
                                                            Detay
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            disabled={saving || row.teklifDurum !== 'aktif'}
                                                            onClick={() => teklifGuncelle(row)}
                                                        >
                                                            Güncelle
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={saving || row.teklifDurum !== 'aktif'}
                                                            onClick={() => teklifIptal(row)}
                                                        >
                                                            Geri Çek
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

export default Ihalelerim;

// helpers
const infoRow = (k: string, v: string) => `
  <div style="padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02)">
    <div style="font-size:11px;color:#6b7280;font-weight:800;margin-bottom:4px">${escapeHtml(k)}</div>
    <div style="font-size:13px;color:#111827;font-weight:800">${escapeHtml(String(v ?? '-'))}</div>
  </div>
`;

const escapeHtml = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
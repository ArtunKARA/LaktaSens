import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Swal from 'sweetalert2';

interface Siparis {
    siparisID: number;
    teklifID: number;
    olusturanFirmaID: number;
    siparisTarihi: string;
    toplamTutar: number;
    durum: string;
    kaynakTipi?: string | null;
    tedarikciID: number;
    tedarikciAdi: string;
    yemID: number;
    yemAdi: string;
    miktarKg: number;
    birimFiyat: number;
}

interface Sevkiyat {
    SevkiyatID: number;
    SiparisID: number;
    SevkTarihi: string;
    BeklenenTeslim: string;
    Durum: string;
    YemID: number;
    yemAdi: string;
    MiktarKg: number;
}

interface DepoGirisPlan {
    planID: number;
    siparisID: number;
    teklifID: number;
    ciftciFirmaID: number;
    ciftciFirmaAdi?: string;
    tedarikciID: number;
    tedarikciFirmaAdi?: string;
    yemID: number;
    yemAdi?: string;
    planlananMiktarKg: number;
    planlananGirisTarihi: string;
    gerceklesenMiktarKg: number;
    kalanMiktarKg: number;
    durum: string;
    olusturmaTarihi?: string | null;
    guncellemeTarihi?: string | null;
    aciklama?: string | null;
}

const Siparis = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [siparisler, setSiparisler] = useState<Siparis[]>([]);
    const [sevkiyatlar, setSevkiyatlar] = useState<Sevkiyat[]>([]);
    const [depoPlanlari, setDepoPlanlari] = useState<DepoGirisPlan[]>([]);

    const [selectedSiparisID, setSelectedSiparisID] = useState<number | null>(null);
    const [selectedSevkiyatID, setSelectedSevkiyatID] = useState<number | null>(null);

    const [planDurumFilter, setPlanDurumFilter] = useState<string>('');
    const [durumFilter, setDurumFilter] = useState<string>('');
    const [kaynakFilter, setKaynakFilter] = useState<string>('');

    const [loadingSiparis, setLoadingSiparis] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loadingSevkiyat, setLoadingSevkiyat] = useState(false);

    const [kabulForm, setKabulForm] = useState({
        kabulMiktarKg: '',
        iadeMiktarKg: '',
        iadeNedeni: '',
        islemNedeniIDKabul: '',
    });

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Yönetimi'));
    }, [dispatch]);

    const fetchSiparisler = async () => {
        setLoadingSiparis(true);
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postSiparisList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firmaID: userInfo?.firmaID,
                    durum: durumFilter || undefined,
                    kaynakTipi: kaynakFilter || undefined,
                }),
            });
            const data = await res.json();
            setSiparisler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Siparişler alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Siparişler alınamadı.' });
        } finally {
            setLoadingSiparis(false);
        }
    };

    const fetchSevkiyatlar = async (siparisID: number) => {
        setLoadingSevkiyat(true);
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postSevkiyatList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID }),
            });
            const data = await res.json();
            setSevkiyatlar(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Sevkiyatlar alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Sevkiyatlar alınamadı.' });
        } finally {
            setLoadingSevkiyat(false);
        }
    };

    const fetchDepoGirisPlanlari = async (opts?: { siparisID?: number | null; durum?: string }) => {
        if (!userInfo?.firmaID && !opts?.siparisID) return;

        setLoadingPlans(true);
        try {
            const payload: any = { firmaID: userInfo?.firmaID };
            if (opts?.siparisID) payload.siparisID = opts.siparisID;
            if (opts?.durum) payload.durum = opts.durum;

            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postDepoGirisPlanList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            setDepoPlanlari(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Depo giriş planları alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Depo giriş planları alınamadı.' });
        } finally {
            setLoadingPlans(false);
        }
    };

    useEffect(() => {
        fetchSiparisler();
        fetchDepoGirisPlanlari();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchDepoGirisPlanlari({ siparisID: selectedSiparisID, durum: planDurumFilter || undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSiparisID, planDurumFilter]);

    const siparisIptal = async (siparisID: number) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Siparişi iptal etmek istiyor musunuz?',
            text: `Sipariş ID: ${siparisID}`,
            showCancelButton: true,
            confirmButtonText: 'Evet, İptal Et',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        });

        if (!confirm.isConfirmed) return;

        try {
            await fetch('http://localhost:3030/api/ciftci/siparis/postSiparisIptal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID, yapanKullaniciID: userInfo?.kullaniciID }),
            });
            await Swal.fire({ icon: 'success', title: 'İptal edildi', timer: 1100, showConfirmButton: false });
            fetchSiparisler();
        } catch (err) {
            console.error('Sipariş iptal edilemedi:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Sipariş iptal edilemedi.' });
        }
    };

    const kabulOlustur = async () => {
        if (!selectedSevkiyatID || !kabulForm.kabulMiktarKg) {
            Swal.fire({ icon: 'warning', title: 'Eksik bilgi', text: 'Sevkiyat ve kabul miktarı zorunlu.' });
            return;
        }

        try {
            await fetch('http://localhost:3030/api/ciftci/siparis/postKabulOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sevkiyatID: selectedSevkiyatID,
                    kabulMiktarKg: Number(kabulForm.kabulMiktarKg),
                    iadeMiktarKg: Number(kabulForm.iadeMiktarKg || 0),
                    iadeNedeni: kabulForm.iadeNedeni,
                    kabulYapanKullaniciID: userInfo?.kullaniciID,
                    islemNedeniIDKabul: kabulForm.islemNedeniIDKabul ? Number(kabulForm.islemNedeniIDKabul) : undefined,
                }),
            });

            setKabulForm({ kabulMiktarKg: '', iadeMiktarKg: '', iadeNedeni: '', islemNedeniIDKabul: '' });

            await Swal.fire({ icon: 'success', title: 'Kabul oluşturuldu', timer: 1200, showConfirmButton: false });

            if (selectedSiparisID) fetchSevkiyatlar(selectedSiparisID);
            fetchSiparisler();
            fetchDepoGirisPlanlari({ siparisID: selectedSiparisID, durum: planDurumFilter || undefined });
        } catch (err) {
            console.error('Kabul oluşturulamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Kabul oluşturulamadı.' });
        }
    };

    const durumText = (durum: string) => {
        if (durum === 'b') return 'Beklemede';
        if (durum === 'o') return 'Onaylandı';
        if (durum === 'i') return 'İptal';
        if (durum === 'r') return 'Reddedildi';
        if (durum === 't') return 'Tamamlandı';
        return durum;
    };

    const kaynakText = (kaynak?: string | null) => {
        if (kaynak === 'ihale') return 'İhale';
        if (kaynak === 'market') return 'Market';
        return kaynak || '-';
    };

    const planDurumText = (durum: string) => {
        if (durum === 'p') return 'Planlandı';
        if (durum === 'k') return 'Kısmi';
        if (durum === 't') return 'Tamamlandı';
        if (durum === 'i') return 'İptal';
        return durum;
    };

    const getPlanBadge = (durum: string) => {
        const label = planDurumText(durum);
        let className = 'badge bg-secondary';
        if (durum === 'p') className = 'badge bg-info';
        if (durum === 'k') className = 'badge bg-warning';
        if (durum === 't') className = 'badge bg-success';
        if (durum === 'i') className = 'badge bg-danger';
        return { className, label };
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR');
    };

    const planSummary = useMemo(() => {
        const summary = {
            total: depoPlanlari.length,
            planned: 0,
            partial: 0,
            done: 0,
            cancelled: 0,
            planlananKg: 0,
            gerceklesenKg: 0,
            kalanKg: 0,
        };

        depoPlanlari.forEach((plan) => {
            summary.planlananKg += Number(plan.planlananMiktarKg || 0);
            summary.gerceklesenKg += Number(plan.gerceklesenMiktarKg || 0);
            summary.kalanKg += Number(plan.kalanMiktarKg || 0);

            if (plan.durum === 'p') summary.planned += 1;
            else if (plan.durum === 'k') summary.partial += 1;
            else if (plan.durum === 't') summary.done += 1;
            else if (plan.durum === 'i') summary.cancelled += 1;
        });

        const completionRate = summary.planlananKg > 0 ? Math.round((summary.gerceklesenKg / summary.planlananKg) * 100) : 0;
        return { ...summary, completionRate };
    }, [depoPlanlari]);

    const clearSiparisSelection = () => {
        setSelectedSiparisID(null);
        setSelectedSevkiyatID(null);
        setSevkiyatlar([]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Sipariş Yönetimi')}</h5>
                        <p className="text-sm text-white-dark mt-1">
                            Siparişleri filtrele, sevkiyat ve depo planlarını takip et, kabul/iade işlemlerini tamamla.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchSiparisler} disabled={loadingSiparis}>
                            {loadingSiparis ? t('Yükleniyor...') : t('Yenile')}
                        </button>
                        {selectedSiparisID && (
                            <button className="btn btn-outline-secondary" onClick={clearSiparisSelection}>
                                {t('Seçimi Kaldır')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h6 className="font-semibold">{t('Sipariş Filtreleri')}</h6>
                    <span className="text-xs text-white-dark">
                        {t('Kayıt')}: <b>{siparisler.length}</b>
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Durum')}</label>
                        <select className="form-select w-full" value={durumFilter} onChange={(e) => setDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="b">{t('Beklemede')}</option>
                            <option value="o">{t('Onaylandı')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="r">{t('Reddedildi')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Kaynak')}</label>
                        <select className="form-select w-full" value={kaynakFilter} onChange={(e) => setKaynakFilter(e.target.value)}>
                            <option value="">{t('Tüm Kaynaklar')}</option>
                            <option value="ihale">{t('İhale')}</option>
                            <option value="market">{t('Market')}</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm flex items-end gap-2">
                        <button className="btn btn-outline-secondary w-full" onClick={() => { setDurumFilter(''); setKaynakFilter(''); }}>
                            {t('Temizle')}
                        </button>
                        <button className="btn btn-primary w-full" onClick={fetchSiparisler} disabled={loadingSiparis}>
                            {t('Filtrele')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Siparişlerim')}</h5>
                        <div className="text-xs text-white-dark">
                            {t('Seçili Sipariş')}: <b>{selectedSiparisID ?? t('Yok')}</b>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('ID')}</th>
                                    <th>{t('Tedarikçi')}</th>
                                    <th>{t('Yem')}</th>
                                    <th>{t('Miktar')}</th>
                                    <th>{t('Toplam')}</th>
                                    <th>{t('Kaynak')}</th>
                                    <th>{t('Durum')}</th>
                                    <th>{t('İşlem')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {siparisler.map((siparis) => (
                                    <tr
                                        key={siparis.siparisID}
                                        className={`hover:bg-gray-50 dark:hover:bg-[#0b1220] ${selectedSiparisID === siparis.siparisID ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <td className="font-semibold">{siparis.siparisID}</td>
                                        <td>
                                            <div className="font-semibold">{siparis.tedarikciAdi}</div>
                                            <div className="text-xs text-white-dark">#{siparis.tedarikciID}</div>
                                        </td>
                                        <td>
                                            <div className="font-semibold">{siparis.yemAdi}</div>
                                            <div className="text-xs text-white-dark">ID: {siparis.yemID}</div>
                                        </td>
                                        <td className="whitespace-nowrap">{siparis.miktarKg}</td>
                                        <td className="whitespace-nowrap font-semibold">{siparis.toplamTutar}</td>
                                        <td className="whitespace-nowrap">
                                            <span className="badge bg-info">{kaynakText(siparis.kaynakTipi)}</span>
                                        </td>
                                        <td className="whitespace-nowrap">{durumText(siparis.durum)}</td>
                                        <td className="whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        setSelectedSiparisID(siparis.siparisID);
                                                        setSelectedSevkiyatID(null);
                                                        fetchSevkiyatlar(siparis.siparisID);
                                                        fetchDepoGirisPlanlari({
                                                            siparisID: siparis.siparisID,
                                                            durum: planDurumFilter || undefined,
                                                        });
                                                    }}
                                                >
                                                    {t('Seç')}
                                                </button>

                                                {siparis.durum === 'b' && (
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => siparisIptal(siparis.siparisID)}>
                                                        {t('İptal')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {siparisler.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center text-gray-500 py-8">
                                            {t('Kayıt bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Depot Plans */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Depo Giriş Planları')}</h5>
                        <div className="text-xs text-white-dark">
                            {t('Seçili Sipariş')}: <b>{selectedSiparisID ?? t('Tümü')}</b>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select className="form-select" value={planDurumFilter} onChange={(e) => setPlanDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="p">{t('Planlandı')}</option>
                            <option value="k">{t('Kısmi')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>

                        <button
                            className="btn btn-outline-primary"
                            onClick={() => fetchDepoGirisPlanlari({ siparisID: selectedSiparisID, durum: planDurumFilter || undefined })}
                            disabled={loadingPlans}
                        >
                            {loadingPlans ? t('Yükleniyor...') : t('Yenile')}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Planlandı')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.planned}</div>
                        <div className="text-xs text-white-dark mt-1">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Kısmi')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.partial}</div>
                        <div className="text-xs text-white-dark mt-1">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Tamamlandı')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.done}</div>
                        <div className="text-xs text-white-dark mt-1">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('İptal')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.cancelled}</div>
                        <div className="text-xs text-white-dark mt-1">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Planlanan KG')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.planlananKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Gerçekleşen KG')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.gerceklesenKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Kalan KG')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.kalanKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                        <div className="text-xs text-white-dark">{t('Tamamlanma %')}</div>
                        <div className="text-2xl font-semibold mt-1">{planSummary.completionRate}%</div>
                    </div>
                </div>

                <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('Plan ID')}</th>
                                    <th>{t('Sipariş')}</th>
                                    <th>{t('Teklif')}</th>
                                    <th>{t('Çiftçi')}</th>
                                    <th>{t('Tedarikçi')}</th>
                                    <th>{t('Yem')}</th>
                                    <th>{t('Plan Miktar')}</th>
                                    <th>{t('Planlanan Giriş')}</th>
                                    <th>{t('Gerçekleşen')}</th>
                                    <th>{t('Kalan')}</th>
                                    <th>{t('Durum')}</th>
                                    <th>{t('Oluşturma')}</th>
                                    <th>{t('Güncelleme')}</th>
                                    <th>{t('Açıklama')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {depoPlanlari.map((plan) => {
                                    const badge = getPlanBadge(plan.durum);
                                    return (
                                        <tr key={plan.planID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                            <td className="font-semibold">{plan.planID}</td>
                                            <td>{plan.siparisID}</td>
                                            <td>{plan.teklifID}</td>
                                            <td>{plan.ciftciFirmaAdi || plan.ciftciFirmaID}</td>
                                            <td>{plan.tedarikciFirmaAdi || plan.tedarikciID}</td>
                                            <td>{plan.yemAdi || plan.yemID}</td>
                                            <td>{plan.planlananMiktarKg}</td>
                                            <td>{formatDate(plan.planlananGirisTarihi)}</td>
                                            <td>{plan.gerceklesenMiktarKg}</td>
                                            <td>{plan.kalanMiktarKg}</td>
                                            <td>
                                                <span className={badge.className}>{badge.label}</span>
                                            </td>
                                            <td>{formatDate(plan.olusturmaTarihi)}</td>
                                            <td>{formatDate(plan.guncellemeTarihi)}</td>
                                            <td className="max-w-[280px] truncate" title={plan.aciklama || ''}>
                                                {plan.aciklama || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {depoPlanlari.length === 0 && (
                                    <tr>
                                        <td colSpan={14} className="text-center text-gray-500 py-8">
                                            {t('Kayıt bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Shipments */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Sevkiyatlar')}</h5>
                        <div className="text-xs text-white-dark">
                            {t('Seçili Sipariş')}: <b>{selectedSiparisID ?? t('Yok')}</b>
                        </div>
                    </div>

                    <button
                        className="btn btn-outline-primary"
                        onClick={() => (selectedSiparisID ? fetchSevkiyatlar(selectedSiparisID) : Swal.fire({ icon: 'info', title: 'Bilgi', text: 'Önce bir sipariş seçin.' }))}
                        disabled={loadingSevkiyat}
                    >
                        {loadingSevkiyat ? t('Yükleniyor...') : t('Yenile')}
                    </button>
                </div>

                <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('Sevkiyat ID')}</th>
                                    <th>{t('Tarih')}</th>
                                    <th>{t('Beklenen Teslim')}</th>
                                    <th>{t('Miktar')}</th>
                                    <th>{t('Durum')}</th>
                                    <th>{t('İşlem')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sevkiyatlar.map((sevk) => (
                                    <tr
                                        key={sevk.SevkiyatID}
                                        className={`hover:bg-gray-50 dark:hover:bg-[#0b1220] ${selectedSevkiyatID === sevk.SevkiyatID ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <td className="font-semibold">{sevk.SevkiyatID}</td>
                                        <td>{formatDate(sevk.SevkTarihi)}</td>
                                        <td>{formatDate(sevk.BeklenenTeslim)}</td>
                                        <td className="whitespace-nowrap">{sevk.MiktarKg}</td>
                                        <td className="whitespace-nowrap">{sevk.Durum}</td>
                                        <td className="whitespace-nowrap">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedSevkiyatID(sevk.SevkiyatID)}>
                                                {t('Kabul Seç')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {sevkiyatlar.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-500 py-8">
                                            {t('Kayıt bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Acceptance */}
            <div className="panel p-5">
                <h5 className="text-lg font-semibold mb-4">{t('Kabul / İade')}</h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Sevkiyat ID')}</label>
                        <input className="form-input w-full" value={selectedSevkiyatID ?? ''} readOnly />
                        <div className="text-xs text-white-dark mt-1">{t('Sevkiyatı tablodan seçin.')}</div>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Kabul Miktarı (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.kabulMiktarKg}
                            onChange={(e) => setKabulForm({ ...kabulForm, kabulMiktarKg: e.target.value })}
                        />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('İade Miktarı (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.iadeMiktarKg}
                            onChange={(e) => setKabulForm({ ...kabulForm, iadeMiktarKg: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('İade Nedeni')}</label>
                        <input className="form-input w-full" value={kabulForm.iadeNedeni} onChange={(e) => setKabulForm({ ...kabulForm, iadeNedeni: e.target.value })} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Kabul İşlem Neden ID')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.islemNedeniIDKabul}
                            onChange={(e) => setKabulForm({ ...kabulForm, islemNedeniIDKabul: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <button className="btn btn-primary" onClick={kabulOlustur}>
                        {t('Kabul Oluştur')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Siparis;
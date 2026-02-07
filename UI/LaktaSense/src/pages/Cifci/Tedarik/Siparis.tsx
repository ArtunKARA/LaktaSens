import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

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

    const [kabulForm, setKabulForm] = useState({
        kabulMiktarKg: '',
        iadeMiktarKg: '',
        iadeNedeni: '',
        islemNedeniIDKabul: ''
    });

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Yönetimi'));
    }, [dispatch]);

    const fetchSiparisler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postSiparisList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firmaID: userInfo?.firmaID,
                    durum: durumFilter || undefined,
                    kaynakTipi: kaynakFilter || undefined
                })
            });
            const data = await res.json();
            setSiparisler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Siparişler alınamadı:', err);
        }
    };

    const fetchSevkiyatlar = async (siparisID: number) => {
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postSevkiyatList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID })
            });
            const data = await res.json();
            setSevkiyatlar(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Sevkiyatlar alınamadı:', err);
        }
    };

    const fetchDepoGirisPlanlari = async (opts?: { siparisID?: number | null; durum?: string }) => {
        if (!userInfo?.firmaID && !opts?.siparisID) return;
        try {
            const payload: any = {
                firmaID: userInfo?.firmaID
            };
            if (opts?.siparisID) payload.siparisID = opts.siparisID;
            if (opts?.durum) payload.durum = opts.durum;

            const res = await fetch('http://localhost:3030/api/ciftci/siparis/postDepoGirisPlanList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setDepoPlanlari(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Depo giriş planları alınamadı:', err);
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
        try {
            await fetch('http://localhost:3030/api/ciftci/siparis/postSiparisIptal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID, yapanKullaniciID: userInfo?.kullaniciID })
            });
            fetchSiparisler();
        } catch (err) {
            console.error('Sipariş iptal edilemedi:', err);
        }
    };

    const kabulOlustur = async () => {
        if (!selectedSevkiyatID || !kabulForm.kabulMiktarKg) {
            alert('Sevkiyat ve kabul miktarı zorunlu.');
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
                    islemNedeniIDKabul: kabulForm.islemNedeniIDKabul ? Number(kabulForm.islemNedeniIDKabul) : undefined
                })
            });

            setKabulForm({ kabulMiktarKg: '', iadeMiktarKg: '', iadeNedeni: '', islemNedeniIDKabul: '' });
            if (selectedSiparisID) fetchSevkiyatlar(selectedSiparisID);
            fetchSiparisler();
            fetchDepoGirisPlanlari({ siparisID: selectedSiparisID, durum: planDurumFilter || undefined });
        } catch (err) {
            console.error('Kabul oluşturulamadı:', err);
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
            kalanKg: 0
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

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Siparişlerim')}</h5>
                    <div className="flex items-center gap-2">
                        <select className="form-select" value={durumFilter} onChange={(e) => setDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="b">{t('Beklemede')}</option>
                            <option value="o">{t('Onaylandı')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="r">{t('Reddedildi')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                        <select className="form-select" value={kaynakFilter} onChange={(e) => setKaynakFilter(e.target.value)}>
                            <option value="">{t('Tüm Kaynaklar')}</option>
                            <option value="ihale">{t('İhale')}</option>
                            <option value="market">{t('Market')}</option>
                        </select>
                        <button className="btn btn-outline-primary" onClick={fetchSiparisler}>
                            {t('Filtrele')}
                        </button>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
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
                                <tr key={siparis.siparisID}>
                                    <td>{siparis.siparisID}</td>
                                    <td>{siparis.tedarikciAdi}</td>
                                    <td>{siparis.yemAdi}</td>
                                    <td>{siparis.miktarKg}</td>
                                    <td>{siparis.toplamTutar}</td>
                                    <td>{kaynakText(siparis.kaynakTipi)}</td>
                                    <td>{durumText(siparis.durum)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    setSelectedSiparisID(siparis.siparisID);
                                                    fetchSevkiyatlar(siparis.siparisID);
                                                    fetchDepoGirisPlanlari({ siparisID: siparis.siparisID, durum: planDurumFilter || undefined });
                                                }}
                                            >
                                                {t('Sevkiyatlar')}
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
                                    <td colSpan={8} className="text-center text-gray-500">
                                        {t('Kayıt bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Depo Giriş Planları')}</h5>
                        <div className="text-xs text-gray-500">
                            {t('Seçili Sipariş')}: {selectedSiparisID ?? t('Tümü')}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="form-select w-full" value={planDurumFilter} onChange={(e) => setPlanDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="p">{t('Planlandı')}</option>
                            <option value="k">{t('Kısmi')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                        <button className="btn btn-outline-primary" onClick={() => fetchDepoGirisPlanlari({ siparisID: selectedSiparisID, durum: planDurumFilter || undefined })}>
                            {t('Yenile')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Planlanan')}</div>
                        <div className="text-2xl font-semibold">{planSummary.planned}</div>
                        <div className="text-xs text-gray-400">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Kısmi')}</div>
                        <div className="text-2xl font-semibold">{planSummary.partial}</div>
                        <div className="text-xs text-gray-400">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Tamamlandı')}</div>
                        <div className="text-2xl font-semibold">{planSummary.done}</div>
                        <div className="text-xs text-gray-400">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('İptal')}</div>
                        <div className="text-2xl font-semibold">{planSummary.cancelled}</div>
                        <div className="text-xs text-gray-400">{t('Toplam')}: {planSummary.total}</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Planlanan KG')}</div>
                        <div className="text-2xl font-semibold">{planSummary.planlananKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Gerçekleşen KG')}</div>
                        <div className="text-2xl font-semibold">{planSummary.gerceklesenKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Kalan KG')}</div>
                        <div className="text-2xl font-semibold">{planSummary.kalanKg.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Tamamlanma %')}</div>
                        <div className="text-2xl font-semibold">{planSummary.completionRate}%</div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
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
                                    <tr key={plan.planID}>
                                        <td>{plan.planID}</td>
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
                                        <td>{plan.aciklama || '-'}</td>
                                    </tr>
                                );
                            })}
                            {depoPlanlari.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="text-center text-gray-500">
                                        {t('Kayıt bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="panel mb-5">
                <h5 className="text-lg font-semibold mb-4">{t('Sevkiyatlar')}</h5>
                <div className="table-responsive">
                    <table className="table table-striped">
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
                                <tr key={sevk.SevkiyatID}>
                                    <td>{sevk.SevkiyatID}</td>
                                    <td>{sevk.SevkTarihi}</td>
                                    <td>{sevk.BeklenenTeslim}</td>
                                    <td>{sevk.MiktarKg}</td>
                                    <td>{sevk.Durum}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setSelectedSevkiyatID(sevk.SevkiyatID)}
                                        >
                                            {t('Kabul Seç')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sevkiyatlar.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-500">
                                        {t('Kayıt bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="panel">
                <h5 className="text-lg font-semibold mb-4">{t('Kabul / İade')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1">{t('Sevkiyat ID')}</label>
                        <input className="form-input w-full" value={selectedSevkiyatID ?? ''} readOnly />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Kabul Miktarı (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.kabulMiktarKg}
                            onChange={(e) => setKabulForm({ ...kabulForm, kabulMiktarKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('İade Miktarı (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.iadeMiktarKg}
                            onChange={(e) => setKabulForm({ ...kabulForm, iadeMiktarKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('İade Nedeni')}</label>
                        <input
                            className="form-input w-full"
                            value={kabulForm.iadeNedeni}
                            onChange={(e) => setKabulForm({ ...kabulForm, iadeNedeni: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Kabul İşlem Neden ID')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={kabulForm.islemNedeniIDKabul}
                            onChange={(e) => setKabulForm({ ...kabulForm, islemNedeniIDKabul: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={kabulOlustur}>
                        {t('Kabul Oluştur')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Siparis;

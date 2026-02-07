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
    ciftciFirmaAdi: string;
    yemAdi: string;
    miktarKg: number;
    birimFiyat: number;
}

interface Iade {
    IadeID: number;
    IadeTarihi: string;
    IadeMiktarKg: number;
    IadeNedeni: string;
    IadeDurumu: string;
    SiparisID: number;
    ciftciFirmaAdi: string;
    yemAdi: string;
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
    ciftciFirmaAdi: string;
}

interface IslemNedeni {
    islemNedeniID: number;
    nedenAdi: string;
    islemTipi: string;
}

const Siparis = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [siparisler, setSiparisler] = useState<Siparis[]>([]);
    const [iadeList, setIadeList] = useState<Iade[]>([]);
    const [sevkiyatlar, setSevkiyatlar] = useState<Sevkiyat[]>([]);
    const [siparisDurumFilter, setSiparisDurumFilter] = useState('');
    const [siparisKaynakFilter, setSiparisKaynakFilter] = useState('');
    const [sevkiyatDurumFilter, setSevkiyatDurumFilter] = useState('');
    const [iadeNedenCikis, setIadeNedenCikis] = useState<IslemNedeni[]>([]);
    const [iadeNedenGiris, setIadeNedenGiris] = useState<IslemNedeni[]>([]);

    const [sevkiyatForm, setSevkiyatForm] = useState({
        siparisID: '',
        sevkTarihi: '',
        beklenenTeslim: '',
        miktarKg: '',
        islemNedeniIDSevk: ''
    });

    const [sevkiyatDurumForm, setSevkiyatDurumForm] = useState({
        sevkiyatID: '',
        yeniDurum: ''
    });

    const [iadeOnayForm, setIadeOnayForm] = useState({
        iadeID: '',
        islemNedeniIDIadeCiftci: '',
        islemNedeniIDIadeTedarikci: ''
    });

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Yönetimi - Tedarikçi'));
    }, [dispatch]);

    const fetchSiparisler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/tedarikci/siparis/postSiparisList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tedarikciID: userInfo?.firmaID,
                    durum: siparisDurumFilter || undefined,
                    kaynakTipi: siparisKaynakFilter || undefined
                })
            });
            const data = await res.json();
            setSiparisler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Siparişler alınamadı:', err);
        }
    };

    const fetchIadeler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/tedarikci/siparis/postIadeList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tedarikciID: userInfo?.firmaID })
            });
            const data = await res.json();
            setIadeList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('İade listesi alınamadı:', err);
        }
    };

    const fetchSevkiyatlar = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/tedarikci/siparis/postSevkiyatList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tedarikciID: userInfo?.firmaID,
                    durum: sevkiyatDurumFilter || undefined
                })
            });
            const data = await res.json();
            setSevkiyatlar(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Sevkiyat listesi alınamadı:', err);
        }
    };

    const fetchIslemNedenleri = async () => {
        try {
            const [cikisRes, girisRes] = await Promise.all([
                fetch('http://localhost:3030/api/depo/postIslemNedenleri', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ islemTipi: 'c' })
                }),
                fetch('http://localhost:3030/api/depo/postIslemNedenleri', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ islemTipi: 'g' })
                })
            ]);

            const cikisData = await cikisRes.json();
            const girisData = await girisRes.json();
            setIadeNedenCikis(Array.isArray(cikisData) ? cikisData : []);
            setIadeNedenGiris(Array.isArray(girisData) ? girisData : []);
        } catch (err) {
            console.error('İşlem nedenleri alınamadı:', err);
        }
    };

    useEffect(() => {
        fetchSiparisler();
        fetchIadeler();
        fetchSevkiyatlar();
        fetchIslemNedenleri();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchSiparisler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siparisDurumFilter, siparisKaynakFilter]);

    useEffect(() => {
        fetchSevkiyatlar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sevkiyatDurumFilter]);

    useEffect(() => {
        if (!iadeOnayForm.islemNedeniIDIadeCiftci && iadeNedenCikis.length > 0) {
            setIadeOnayForm((prev) => ({ ...prev, islemNedeniIDIadeCiftci: String(iadeNedenCikis[0].islemNedeniID) }));
        }
        if (!iadeOnayForm.islemNedeniIDIadeTedarikci && iadeNedenGiris.length > 0) {
            setIadeOnayForm((prev) => ({ ...prev, islemNedeniIDIadeTedarikci: String(iadeNedenGiris[0].islemNedeniID) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iadeNedenCikis, iadeNedenGiris]);

    const siparisOnay = async (siparisID: number) => {
        try {
            await fetch('http://localhost:3030/api/tedarikci/siparis/postSiparisOnay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID, yapanKullaniciID: userInfo?.kullaniciID })
            });
            fetchSiparisler();
        } catch (err) {
            console.error('Sipariş onaylanamadı:', err);
        }
    };

    const siparisRed = async (siparisID: number) => {
        try {
            await fetch('http://localhost:3030/api/tedarikci/siparis/postSiparisRed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siparisID, yapanKullaniciID: userInfo?.kullaniciID })
            });
            fetchSiparisler();
        } catch (err) {
            console.error('Sipariş reddedilemedi:', err);
        }
    };

    const sevkiyatOlustur = async () => {
        if (!sevkiyatForm.siparisID || !sevkiyatForm.sevkTarihi || !sevkiyatForm.beklenenTeslim || !sevkiyatForm.miktarKg) {
            alert('Zorunlu alanları doldurun.');
            return;
        }

        try {
            await fetch('http://localhost:3030/api/tedarikci/siparis/postSevkiyatOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siparisID: Number(sevkiyatForm.siparisID),
                    sevkTarihi: new Date(sevkiyatForm.sevkTarihi).toISOString(),
                    beklenenTeslim: new Date(sevkiyatForm.beklenenTeslim).toISOString(),
                    miktarKg: Number(sevkiyatForm.miktarKg),
                    kullaniciID: userInfo?.kullaniciID,
                    islemNedeniIDSevk: sevkiyatForm.islemNedeniIDSevk ? Number(sevkiyatForm.islemNedeniIDSevk) : undefined
                })
            });
            setSevkiyatForm({ siparisID: '', sevkTarihi: '', beklenenTeslim: '', miktarKg: '', islemNedeniIDSevk: '' });
            fetchSevkiyatlar();
            fetchSiparisler();
        } catch (err) {
            console.error('Sevkiyat oluşturulamadı:', err);
        }
    };

    const sevkiyatDurumGuncelle = async () => {
        if (!sevkiyatDurumForm.sevkiyatID || !sevkiyatDurumForm.yeniDurum) {
            alert('Sevkiyat ID ve yeni durum zorunlu.');
            return;
        }

        try {
            await fetch('http://localhost:3030/api/tedarikci/siparis/postSevkiyatDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sevkiyatID: Number(sevkiyatDurumForm.sevkiyatID),
                    yeniDurum: sevkiyatDurumForm.yeniDurum,
                    yapanKullaniciID: userInfo?.kullaniciID
                })
            });
            setSevkiyatDurumForm({ sevkiyatID: '', yeniDurum: '' });
            fetchSevkiyatlar();
        } catch (err) {
            console.error('Sevkiyat durumu güncellenemedi:', err);
        }
    };

    const iadeOnay = async (yeniDurum: 'a' | 'r') => {
        if (!iadeOnayForm.iadeID) {
            alert('İade ID zorunlu.');
            return;
        }
        if (yeniDurum === 'a' && (!iadeOnayForm.islemNedeniIDIadeCiftci || !iadeOnayForm.islemNedeniIDIadeTedarikci)) {
            alert('İade nedenleri zorunlu.');
            return;
        }

        const payload: any = {
            iadeID: Number(iadeOnayForm.iadeID),
            yeniDurum
        };

        if (yeniDurum === 'a') {
            payload.yapanKullaniciID = userInfo?.kullaniciID;
            payload.islemNedeniIDIadeCiftci = Number(iadeOnayForm.islemNedeniIDIadeCiftci);
            payload.islemNedeniIDIadeTedarikci = Number(iadeOnayForm.islemNedeniIDIadeTedarikci);
        }

        try {
            await fetch('http://localhost:3030/api/tedarikci/siparis/postIadeDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setIadeOnayForm({ iadeID: '', islemNedeniIDIadeCiftci: '', islemNedeniIDIadeTedarikci: '' });
            fetchIadeler();
        } catch (err) {
            console.error('İade güncellenemedi:', err);
        }
    };

    const siparisDurumText = (durum: string) => {
        if (durum === 'b') return 'Beklemede';
        if (durum === 'o') return 'Onaylandı';
        if (durum === 'r') return 'Reddedildi';
        if (durum === 'i') return 'İptal';
        if (durum === 't') return 'Tamamlandı';
        return durum;
    };

    const sevkiyatDurumText = (durum: string) => {
        if (durum === 'h') return 'Hazırlıkta';
        if (durum === 'y') return 'Yolda';
        if (durum === 't') return 'Tamamlandı';
        if (durum === 'i') return 'İptal';
        return durum;
    };

    const sevkiyatDurumColor = (durum: string) => {
        if (durum === 'h') return 'warning';
        if (durum === 'y') return 'primary';
        if (durum === 't') return 'success';
        if (durum === 'i') return 'danger';
        return 'secondary';
    };

    const formatDateTime = (value?: string) => {
        if (!value) return '-';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
    };

    const siparisSummary = useMemo(() => {
        return {
            total: siparisler.length,
            beklemede: siparisler.filter((s) => s.durum === 'b').length,
            onay: siparisler.filter((s) => s.durum === 'o').length,
            reddedildi: siparisler.filter((s) => s.durum === 'r').length,
            iptal: siparisler.filter((s) => s.durum === 'i').length,
            tamamlandi: siparisler.filter((s) => s.durum === 't').length
        };
    }, [siparisler]);

    const sevkiyatSummary = useMemo(() => {
        return {
            total: sevkiyatlar.length,
            hazirlik: sevkiyatlar.filter((s) => s.Durum === 'h').length,
            yolda: sevkiyatlar.filter((s) => s.Durum === 'y').length,
            tamamlandi: sevkiyatlar.filter((s) => s.Durum === 't').length,
            iptal: sevkiyatlar.filter((s) => s.Durum === 'i').length
        };
    }, [sevkiyatlar]);

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Siparişler')}</h5>
                    <div className="flex items-center gap-2">
                        <select className="form-select" value={siparisDurumFilter} onChange={(e) => setSiparisDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="b">{t('Beklemede')}</option>
                            <option value="o">{t('Onaylandı')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="r">{t('Reddedildi')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                        <select className="form-select" value={siparisKaynakFilter} onChange={(e) => setSiparisKaynakFilter(e.target.value)}>
                            <option value="">{t('Tüm Kaynaklar')}</option>
                            <option value="ihale">{t('İhale')}</option>
                            <option value="market">{t('Market')}</option>
                        </select>
                        <button className="btn btn-outline-primary" onClick={fetchSiparisler}>
                            {t('Filtrele')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Toplam')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.total}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Beklemede')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.beklemede}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Onaylandı')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.onay}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Tamamlandı')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.tamamlandi}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Reddedildi')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.reddedildi}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('İptal')}</div>
                        <div className="text-2xl font-semibold">{siparisSummary.iptal}</div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('ID')}</th>
                                <th>{t('Çiftlik')}</th>
                                <th>{t('Yem')}</th>
                                <th>{t('Miktar')}</th>
                                <th>{t('Toplam')}</th>
                                <th>{t('Durum')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {siparisler.map((siparis) => (
                                <tr key={siparis.siparisID}>
                                    <td>{siparis.siparisID}</td>
                                    <td>{siparis.ciftciFirmaAdi}</td>
                                    <td>{siparis.yemAdi}</td>
                                    <td>{siparis.miktarKg}</td>
                                    <td>{siparis.toplamTutar}</td>
                                    <td>{siparisDurumText(siparis.durum)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {siparis.durum === 'b' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => siparisOnay(siparis.siparisID)}>
                                                    {t('Onayla')}
                                                </button>
                                            )}
                                            {siparis.durum === 'b' && (
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => siparisRed(siparis.siparisID)}>
                                                    {t('Reddet')}
                                                </button>
                                            )}
                                            {siparis.durum === 'o' && (
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setSevkiyatForm({ ...sevkiyatForm, siparisID: String(siparis.siparisID) })}
                                                >
                                                    {t('Sevkiyat')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {siparisler.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-500">
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
                    <h5 className="text-lg font-semibold">{t('Sevkiyatlar')}</h5>
                    <div className="flex items-center gap-2">
                        <select className="form-select" value={sevkiyatDurumFilter} onChange={(e) => setSevkiyatDurumFilter(e.target.value)}>
                            <option value="">{t('Tüm Durumlar')}</option>
                            <option value="h">{t('Hazırlıkta')}</option>
                            <option value="y">{t('Yolda')}</option>
                            <option value="t">{t('Tamamlandı')}</option>
                            <option value="i">{t('İptal')}</option>
                        </select>
                        <button className="btn btn-outline-primary" onClick={fetchSevkiyatlar}>
                            {t('Yenile')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Toplam')}</div>
                        <div className="text-2xl font-semibold">{sevkiyatSummary.total}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Hazırlıkta')}</div>
                        <div className="text-2xl font-semibold">{sevkiyatSummary.hazirlik}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Yolda')}</div>
                        <div className="text-2xl font-semibold">{sevkiyatSummary.yolda}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('Tamamlandı')}</div>
                        <div className="text-2xl font-semibold">{sevkiyatSummary.tamamlandi}</div>
                    </div>
                    <div className="panel p-4">
                        <div className="text-xs text-gray-500">{t('İptal')}</div>
                        <div className="text-2xl font-semibold">{sevkiyatSummary.iptal}</div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Sevkiyat ID')}</th>
                                <th>{t('Sipariş')}</th>
                                <th>{t('Çiftlik')}</th>
                                <th>{t('Yem')}</th>
                                <th>{t('Miktar')}</th>
                                <th>{t('Sevk Tarihi')}</th>
                                <th>{t('Beklenen Teslim')}</th>
                                <th>{t('Durum')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sevkiyatlar.map((sevk) => (
                                <tr key={sevk.SevkiyatID}>
                                    <td>{sevk.SevkiyatID}</td>
                                    <td>{sevk.SiparisID}</td>
                                    <td>{sevk.ciftciFirmaAdi}</td>
                                    <td>{sevk.yemAdi}</td>
                                    <td>{sevk.MiktarKg}</td>
                                    <td>{formatDateTime(sevk.SevkTarihi)}</td>
                                    <td>{formatDateTime(sevk.BeklenenTeslim)}</td>
                                    <td>
                                        <span className={`badge bg-${sevkiyatDurumColor(sevk.Durum)}`}>{sevkiyatDurumText(sevk.Durum)}</span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setSevkiyatDurumForm({ ...sevkiyatDurumForm, sevkiyatID: String(sevk.SevkiyatID) })}
                                        >
                                            {t('Durum Güncelle')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sevkiyatlar.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center text-gray-500">
                                        {t('Kayıt bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="panel mb-5">
                <h5 className="text-lg font-semibold mb-4">{t('Sevkiyat Oluştur')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">{t('Sipariş ID')}</label>
                        <input className="form-input w-full" value={sevkiyatForm.siparisID} onChange={(e) => setSevkiyatForm({ ...sevkiyatForm, siparisID: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Sevk Tarihi')}</label>
                        <input type="datetime-local" className="form-input w-full" value={sevkiyatForm.sevkTarihi} onChange={(e) => setSevkiyatForm({ ...sevkiyatForm, sevkTarihi: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Beklenen Teslim')}</label>
                        <input type="datetime-local" className="form-input w-full" value={sevkiyatForm.beklenenTeslim} onChange={(e) => setSevkiyatForm({ ...sevkiyatForm, beklenenTeslim: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Miktar (kg)')}</label>
                        <input type="number" className="form-input w-full" value={sevkiyatForm.miktarKg} onChange={(e) => setSevkiyatForm({ ...sevkiyatForm, miktarKg: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Sevk İşlem Nedeni')}</label>
                        <select
                            className="form-select w-full"
                            value={sevkiyatForm.islemNedeniIDSevk}
                            onChange={(e) => setSevkiyatForm({ ...sevkiyatForm, islemNedeniIDSevk: e.target.value })}
                        >
                            <option value="">{t('Seçiniz')}</option>
                            {iadeNedenCikis.map((neden) => (
                                <option key={neden.islemNedeniID} value={neden.islemNedeniID}>
                                    {neden.nedenAdi}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={sevkiyatOlustur}>
                        {t('Sevkiyat Oluştur')}
                    </button>
                </div>
            </div>

            <div className="panel mb-5">
                <h5 className="text-lg font-semibold mb-4">{t('Sevkiyat Durum Güncelle')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">{t('Sevkiyat ID')}</label>
                        <input
                            className="form-input w-full"
                            value={sevkiyatDurumForm.sevkiyatID}
                            onChange={(e) => setSevkiyatDurumForm({ ...sevkiyatDurumForm, sevkiyatID: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Yeni Durum')}</label>
                        <select
                            className="form-select w-full"
                            value={sevkiyatDurumForm.yeniDurum}
                            onChange={(e) => setSevkiyatDurumForm({ ...sevkiyatDurumForm, yeniDurum: e.target.value })}
                        >
                            <option value="">{t('Seçiniz')}</option>
                            <option value="h">Hazırlıkta</option>
                            <option value="y">Yolda</option>
                            <option value="t">Tamamlandı</option>
                            <option value="i">İptal</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={sevkiyatDurumGuncelle}>
                        {t('Güncelle')}
                    </button>
                </div>
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('İade Talepleri')}</h5>
                    <button className="btn btn-outline-primary" onClick={fetchIadeler}>
                        {t('Yenile')}
                    </button>
                </div>
                <div className="table-responsive mb-4">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('İade ID')}</th>
                                <th>{t('Sipariş')}</th>
                                <th>{t('Çiftlik')}</th>
                                <th>{t('Yem')}</th>
                                <th>{t('Miktar')}</th>
                                <th>{t('Durum')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {iadeList.map((iade) => (
                                <tr key={iade.IadeID}>
                                    <td>{iade.IadeID}</td>
                                    <td>{iade.SiparisID}</td>
                                    <td>{iade.ciftciFirmaAdi}</td>
                                    <td>{iade.yemAdi}</td>
                                    <td>{iade.IadeMiktarKg}</td>
                                    <td>{iade.IadeDurumu}</td>
                                </tr>
                            ))}
                            {iadeList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-500">
                                        {t('Kayıt bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">{t('İade ID')}</label>
                        <input className="form-input w-full" value={iadeOnayForm.iadeID} onChange={(e) => setIadeOnayForm({ ...iadeOnayForm, iadeID: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('İade Çiftçi Nedeni')}</label>
                        <select
                            className="form-select w-full"
                            value={iadeOnayForm.islemNedeniIDIadeCiftci}
                            onChange={(e) => setIadeOnayForm({ ...iadeOnayForm, islemNedeniIDIadeCiftci: e.target.value })}
                        >
                            <option value="">{t('Seçiniz')}</option>
                            {iadeNedenCikis.map((neden) => (
                                <option key={neden.islemNedeniID} value={neden.islemNedeniID}>
                                    {neden.nedenAdi}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">{t('İade Tedarikçi Nedeni')}</label>
                        <select
                            className="form-select w-full"
                            value={iadeOnayForm.islemNedeniIDIadeTedarikci}
                            onChange={(e) => setIadeOnayForm({ ...iadeOnayForm, islemNedeniIDIadeTedarikci: e.target.value })}
                        >
                            <option value="">{t('Seçiniz')}</option>
                            {iadeNedenGiris.map((neden) => (
                                <option key={neden.islemNedeniID} value={neden.islemNedeniID}>
                                    {neden.nedenAdi}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="btn btn-primary" onClick={() => iadeOnay('a')}>
                        {t('İade Onayla')}
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => iadeOnay('r')}>
                        {t('İade Reddet')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Siparis;

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

interface Ihale {
    ihaleID: number;
    ihaleAdi: string;
    ihaleBaslangicTarihi: string;
    ihaleBitisTarihi: string;
    durum: string;
    aciklama: string;
    acanFirmaID: number;
    acanFirmaAdi: string;
    yemID: number;
    yemAdi: string;
    talepMiktarKg: number;
    kalanMiktarKg: number;
}

interface Teklif {
    teklifID: number;
    ihaleID: number;
    tedarikciID: number;
    teklifMiktarKg: number;
    birimFiyat: number;
    toplamTutar: number;
    teklifTarihi: string;
    durum: string;
    ihaleAdi: string;
    yemAdi: string;
}

const Ihale = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [acikIhaleler, setAcikIhaleler] = useState<Ihale[]>([]);
    const [teklifler, setTeklifler] = useState<Teklif[]>([]);

    const [teklifForm, setTeklifForm] = useState({
        ihaleID: '',
        teklifMiktarKg: '',
        birimFiyat: ''
    });

    const [guncelleForm, setGuncelleForm] = useState({
        teklifID: '',
        teklifMiktarKg: '',
        birimFiyat: ''
    });

    useEffect(() => {
        dispatch(setPageTitle('İhale - Tedarikçi'));
    }, [dispatch]);

    const fetchAcikIhaleler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/tedarikci/ihale/postAcikIhaleList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            setAcikIhaleler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Açık ihaleler alınamadı:', err);
        }
    };

    const fetchTeklifler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tedarikciID: userInfo?.firmaID })
            });
            const data = await res.json();
            setTeklifler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Teklifler alınamadı:', err);
        }
    };

    useEffect(() => {
        fetchAcikIhaleler();
        fetchTeklifler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const teklifOlustur = async () => {
        if (!teklifForm.ihaleID || !teklifForm.teklifMiktarKg || !teklifForm.birimFiyat) {
            alert('Zorunlu alanları doldurun.');
            return;
        }

        try {
            await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ihaleID: Number(teklifForm.ihaleID),
                    tedarikciID: userInfo?.firmaID,
                    teklifMiktarKg: Number(teklifForm.teklifMiktarKg),
                    birimFiyat: Number(teklifForm.birimFiyat),
                    yapanKullaniciID: userInfo?.kullaniciID
                })
            });
            setTeklifForm({ ihaleID: '', teklifMiktarKg: '', birimFiyat: '' });
            fetchTeklifler();
        } catch (err) {
            console.error('Teklif oluşturulamadı:', err);
        }
    };

    const teklifCek = async (teklifID: number) => {
        try {
            await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifCek', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teklifID, tedarikciID: userInfo?.firmaID, yapanKullaniciID: userInfo?.kullaniciID })
            });
            fetchTeklifler();
        } catch (err) {
            console.error('Teklif çekilemedi:', err);
        }
    };

    const teklifGuncelle = async () => {
        if (!guncelleForm.teklifID || !guncelleForm.teklifMiktarKg || !guncelleForm.birimFiyat) {
            alert('Zorunlu alanları doldurun.');
            return;
        }

        try {
            await fetch('http://localhost:3030/api/tedarikci/ihale/postTeklifGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teklifID: Number(guncelleForm.teklifID),
                    tedarikciID: userInfo?.firmaID,
                    teklifMiktarKg: Number(guncelleForm.teklifMiktarKg),
                    birimFiyat: Number(guncelleForm.birimFiyat),
                    yapanKullaniciID: userInfo?.kullaniciID
                })
            });
            setGuncelleForm({ teklifID: '', teklifMiktarKg: '', birimFiyat: '' });
            fetchTeklifler();
        } catch (err) {
            console.error('Teklif güncellenemedi:', err);
        }
    };

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Açık İhaleler')}</h5>
                    <button className="btn btn-outline-primary" onClick={fetchAcikIhaleler}>
                        {t('Yenile')}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('ID')}</th>
                                <th>{t('İhale')}</th>
                                <th>{t('Yem')}</th>
                                <th>{t('Talep')}</th>
                                <th>{t('Kalan')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {acikIhaleler.map((ihale) => (
                                <tr key={ihale.ihaleID}>
                                    <td>{ihale.ihaleID}</td>
                                    <td>{ihale.ihaleAdi || '-'}</td>
                                    <td>{ihale.yemAdi}</td>
                                    <td>{ihale.talepMiktarKg}</td>
                                    <td>{ihale.kalanMiktarKg}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setTeklifForm({ ...teklifForm, ihaleID: String(ihale.ihaleID) })}
                                        >
                                            {t('Teklif Ver')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {acikIhaleler.length === 0 && (
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

            <div className="panel mb-5">
                <h5 className="text-lg font-semibold mb-4">{t('Teklif Oluştur')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">{t('İhale ID')}</label>
                        <input
                            className="form-input w-full"
                            value={teklifForm.ihaleID}
                            onChange={(e) => setTeklifForm({ ...teklifForm, ihaleID: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Miktar (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={teklifForm.teklifMiktarKg}
                            onChange={(e) => setTeklifForm({ ...teklifForm, teklifMiktarKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Birim Fiyat')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={teklifForm.birimFiyat}
                            onChange={(e) => setTeklifForm({ ...teklifForm, birimFiyat: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={teklifOlustur}>
                        {t('Teklif Gönder')}
                    </button>
                </div>
            </div>

            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Tekliflerim')}</h5>
                    <button className="btn btn-outline-primary" onClick={fetchTeklifler}>
                        {t('Yenile')}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Teklif ID')}</th>
                                <th>{t('İhale')}</th>
                                <th>{t('Yem')}</th>
                                <th>{t('Miktar')}</th>
                                <th>{t('Birim Fiyat')}</th>
                                <th>{t('Toplam')}</th>
                                <th>{t('Durum')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teklifler.map((teklif) => (
                                <tr key={teklif.teklifID}>
                                    <td>{teklif.teklifID}</td>
                                    <td>{teklif.ihaleAdi || '-'}</td>
                                    <td>{teklif.yemAdi}</td>
                                    <td>{teklif.teklifMiktarKg}</td>
                                    <td>{teklif.birimFiyat}</td>
                                    <td>{teklif.toplamTutar}</td>
                                    <td>{teklif.durum}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {teklif.durum === 'b' && (
                                                <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => setGuncelleForm({
                                                        teklifID: String(teklif.teklifID),
                                                        teklifMiktarKg: String(teklif.teklifMiktarKg),
                                                        birimFiyat: String(teklif.birimFiyat)
                                                    })}
                                                >
                                                    {t('Güncelle')}
                                                </button>
                                            )}
                                            {teklif.durum === 'b' && (
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => teklifCek(teklif.teklifID)}>
                                                    {t('Çek')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teklifler.length === 0 && (
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

            <div className="panel">
                <h5 className="text-lg font-semibold mb-4">{t('Teklif Güncelle')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">{t('Teklif ID')}</label>
                        <input
                            className="form-input w-full"
                            value={guncelleForm.teklifID}
                            onChange={(e) => setGuncelleForm({ ...guncelleForm, teklifID: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Miktar (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={guncelleForm.teklifMiktarKg}
                            onChange={(e) => setGuncelleForm({ ...guncelleForm, teklifMiktarKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Birim Fiyat')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={guncelleForm.birimFiyat}
                            onChange={(e) => setGuncelleForm({ ...guncelleForm, birimFiyat: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={teklifGuncelle}>
                        {t('Kaydet')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Ihale;

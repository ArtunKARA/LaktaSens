import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import Select, { SingleValue, StylesConfig } from 'react-select';

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
    teklifSayisi?: number;
    enDusukBirimFiyat?: number;
    sonTeklifTarihi?: string;
}

interface OptionType {
    value: string;
    label: string;
}

const Ihalelerim = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [ihaleler, setIhaleler] = useState<Ihale[]>([]);
    const [durumFilter, setDurumFilter] = useState<OptionType | null>(null);
    const [baslangicTarihi, setBaslangicTarihi] = useState<string>('');
    const [bitisTarihi, setBitisTarihi] = useState<string>('');
    const menuStyles: StylesConfig<OptionType, false> = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };

    useEffect(() => {
        dispatch(setPageTitle('İhalelerim'));
    }, [dispatch]);

    useEffect(() => {
        const raw = localStorage.getItem('ihaleListFilters');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.baslangicTarihi) setBaslangicTarihi(parsed.baslangicTarihi);
            if (parsed?.bitisTarihi) setBitisTarihi(parsed.bitisTarihi);
            if (parsed?.durum) {
                const opts = [
                    { value: 'a', label: t('Açık') },
                    { value: 'k', label: t('Kapalı') },
                    { value: 't', label: t('Tamamlandı') },
                    { value: 'i', label: t('İptal') }
                ];
                const found = opts.find((o) => o.value === parsed.durum);
                if (found) setDurumFilter(found);
            }
        } catch (err) {
            console.error('Filtreler okunamadı:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const value = JSON.stringify({
            baslangicTarihi,
            bitisTarihi,
            durum: durumFilter?.value || ''
        });
        localStorage.setItem('ihaleListFilters', value);
    }, [baslangicTarihi, bitisTarihi, durumFilter]);

    const fetchIhaleler = async () => {
        try {
            const body: any = { acanFirmaID: userInfo?.firmaID };
            if (durumFilter?.value) body.durum = durumFilter.value;
            if (baslangicTarihi) {
                const start = new Date(baslangicTarihi);
                start.setHours(0, 0, 0, 0);
                body.baslangicTarihi = start.toISOString();
            }
            if (bitisTarihi) {
                const end = new Date(bitisTarihi);
                end.setHours(23, 59, 59, 999);
                body.bitisTarihi = end.toISOString();
            }

            const res = await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            setIhaleler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('İhaleler alınamadı:', err);
        }
    };

    useEffect(() => {
        fetchIhaleler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durumFilter, baslangicTarihi, bitisTarihi, userInfo?.firmaID]);

    const durumKapat = async (ihaleID: number) => {
        try {
            await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ihaleID,
                    durum: 'k',
                    yapanKullaniciID: userInfo?.kullaniciID,
                    aciklama: 'Çiftçi ihale kapattı'
                })
            });
            fetchIhaleler();
        } catch (err) {
            console.error('İhale kapatılamadı:', err);
        }
    };

    const durumIptal = async (ihaleID: number) => {
        try {
            await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ihaleID,
                    durum: 'i',
                    yapanKullaniciID: userInfo?.kullaniciID,
                    aciklama: 'Çiftçi ihale iptal etti'
                })
            });
            fetchIhaleler();
        } catch (err) {
            console.error('İhale iptal edilemedi:', err);
        }
    };

    const durumText = (durum: string) => {
        if (durum === 'a') return 'Açık';
        if (durum === 'k') return 'Kapalı';
        if (durum === 't') return 'Tamamlandı';
        if (durum === 'i') return 'İptal';
        return durum;
    };

    const getKalanBadge = (kalan: number, talep: number) => {
        const kalanValue = Number(kalan);
        const talepValue = Number(talep);
        if (kalanValue <= 0) {
            return { className: 'badge bg-success', label: t('Tamamlandı') };
        }
        const oran = talepValue > 0 ? kalanValue / talepValue : 1;
        if (oran <= 0.2) {
            return { className: 'badge bg-warning', label: `${kalanValue} kg - ${t('Az Kaldı')}` };
        }
        return { className: 'badge bg-info', label: `${kalanValue} kg` };
    };

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR');
    };

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('İhalelerim')}</h5>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchIhaleler}>
                            {t('Yenile')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block mb-1">{t('Başlangıç Tarihi')}</label>
                        <input
                            type="date"
                            className="form-input w-full"
                            value={baslangicTarihi}
                            onChange={(e) => setBaslangicTarihi(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Bitiş Tarihi')}</label>
                        <input
                            type="date"
                            className="form-input w-full"
                            value={bitisTarihi}
                            onChange={(e) => setBitisTarihi(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Durum')}</label>
                        <Select
                            options={[
                                { value: '', label: t('Tümü') },
                                { value: 'a', label: t('Açık') },
                                { value: 'k', label: t('Kapalı') },
                                { value: 't', label: t('Tamamlandı') },
                                { value: 'i', label: t('İptal') }
                            ]}
                            value={durumFilter}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                            styles={menuStyles}
                            onChange={(selected: SingleValue<OptionType>) => setDurumFilter(selected)}
                            placeholder={t('Please Select')}
                            isSearchable={true}
                            isClearable={true}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            className="btn btn-outline-secondary w-full"
                            onClick={() => {
                                setBaslangicTarihi('');
                                setBitisTarihi('');
                                setDurumFilter(null);
                            }}
                        >
                            {t('Temizle')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {ihaleler.map((ihale) => {
                        const kalanBadge = getKalanBadge(ihale.kalanMiktarKg, ihale.talepMiktarKg);
                        return (
                            <div key={`card-${ihale.ihaleID}`} className="panel p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold">{ihale.ihaleAdi || t('İhale')}</div>
                                    <span className={kalanBadge.className}>{kalanBadge.label}</span>
                                </div>
                                <div className="text-sm text-gray-500 mb-2">{ihale.yemAdi}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-gray-500">{t('En Düşük Fiyat')}</div>
                                        <div className="font-semibold">{ihale.enDusukBirimFiyat ?? '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">{t('Teklif Sayısı')}</div>
                                        <div className="font-semibold">{ihale.teklifSayisi ?? 0}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-500">{t('Son Teklif')}</div>
                                        <div className="font-semibold">{formatDate(ihale.sonTeklifTarihi)}</div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/cifci/tedarik/ihale/${ihale.ihaleID}`)}>
                                        {t('Detay')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {ihaleler.length === 0 && (
                        <div className="text-gray-500">{t('Kayıt bulunamadı')}</div>
                    )}
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
                                <th>{t('Durum')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ihaleler.map((ihale) => {
                                const kalanBadge = getKalanBadge(ihale.kalanMiktarKg, ihale.talepMiktarKg);
                                return (
                                    <tr key={ihale.ihaleID}>
                                        <td>{ihale.ihaleID}</td>
                                        <td>{ihale.ihaleAdi || '-'}</td>
                                        <td>{ihale.yemAdi}</td>
                                        <td>{ihale.talepMiktarKg}</td>
                                        <td>
                                            <span className={kalanBadge.className}>{kalanBadge.label}</span>
                                        </td>
                                        <td>{durumText(ihale.durum)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => navigate(`/cifci/tedarik/ihale/${ihale.ihaleID}`)}
                                                >
                                                    {t('Detay')}
                                                </button>
                                                {ihale.durum === 'a' && (
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => durumKapat(ihale.ihaleID)}>
                                                        {t('Kapat')}
                                                    </button>
                                                )}
                                                {ihale.durum === 'a' && (
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => durumIptal(ihale.ihaleID)}>
                                                        {t('İptal')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {ihaleler.length === 0 && (
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
        </div>
    );
};

export default Ihalelerim;

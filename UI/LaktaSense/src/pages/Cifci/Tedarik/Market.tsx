import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

interface MarketItem {
    yemID: number;
    yemAdi: string;
    ozelYem: boolean;
    durum: string;
    yemFirmaID?: number | null;
    birimFiyat: number;
    minSiparisKg?: number | null;
    maxSiparisKg?: number | null;
    yemAciklama?: string | null;
    tedarikciID: number;
    tedarikciAdi: string;
    stokKg: number;
}

interface BesinDegeri {
    besinDegeriID: number;
    tipID: number;
    besinTipi: string;
    miktar: number;
    birimID: number;
    birimAdi: string;
}

interface MarketDetay extends MarketItem {
    besinDegerleri: BesinDegeri[];
}

const Market = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [marketList, setMarketList] = useState<MarketItem[]>([]);
    const [selectedDetay, setSelectedDetay] = useState<MarketDetay | null>(null);
    const [loading, setLoading] = useState(false);

    const [arama, setArama] = useState('');
    const [ozelYem, setOzelYem] = useState('');
    const [tedarikciID, setTedarikciID] = useState('');
    const [minFiyat, setMinFiyat] = useState('');
    const [maxFiyat, setMaxFiyat] = useState('');
    const [minStok, setMinStok] = useState('');
    const [minSiparisKg, setMinSiparisKg] = useState('');
    const [maxSiparisKg, setMaxSiparisKg] = useState('');
    const [stokVar, setStokVar] = useState(true);
    const [siralama, setSiralama] = useState('fiyat_asc');
    const [planlananGirisTarihi, setPlanlananGirisTarihi] = useState('');
    const [siparisMiktarlari, setSiparisMiktarlari] = useState<Record<string, string>>({});

    useEffect(() => {
        dispatch(setPageTitle('Market'));
    }, [dispatch]);

    useEffect(() => {
        if (!planlananGirisTarihi) {
            const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
            const offset = target.getTimezoneOffset();
            const localDate = new Date(target.getTime() - offset * 60 * 1000);
            setPlanlananGirisTarihi(localDate.toISOString().slice(0, 16));
        }
    }, [planlananGirisTarihi]);

    const tedarikciOptions = useMemo(() => {
        const uniq = new Map<number, string>();
        marketList.forEach((item) => {
            if (item.tedarikciID && item.tedarikciAdi) {
                uniq.set(item.tedarikciID, item.tedarikciAdi);
            }
        });
        return Array.from(uniq.entries()).map(([id, adi]) => ({ id, adi }));
    }, [marketList]);

    const fetchMarket = async () => {
        setLoading(true);
        try {
            const payload: any = {
                arama: arama || undefined,
                ozelYem: ozelYem !== '' ? ozelYem === '1' : undefined,
                tedarikciID: tedarikciID ? Number(tedarikciID) : undefined,
                minFiyat: minFiyat ? Number(minFiyat) : undefined,
                maxFiyat: maxFiyat ? Number(maxFiyat) : undefined,
                minStok: minStok ? Number(minStok) : undefined,
                minSiparisKg: minSiparisKg ? Number(minSiparisKg) : undefined,
                maxSiparisKg: maxSiparisKg ? Number(maxSiparisKg) : undefined,
                stokVar: stokVar,
                siralama
            };

            const res = await fetch('http://localhost:3030/api/ciftci/market/postMarketList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setMarketList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Market listesi alınamadı:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDetay = async (item: MarketItem) => {
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/market/postMarketDetay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yemID: item.yemID, tedarikciID: item.tedarikciID })
            });
            const data = await res.json();
            setSelectedDetay(data || null);
        } catch (err) {
            console.error('Market detay alınamadı:', err);
        }
    };

    const handleSiparisOlustur = async (item: MarketItem) => {
        const key = `${item.yemID}-${item.tedarikciID}`;
        const miktar = Number(siparisMiktarlari[key] || 0);
        if (!miktar || miktar <= 0) {
            alert('Sipariş miktarı zorunlu.');
            return;
        }
        if (item.minSiparisKg && miktar < Number(item.minSiparisKg)) {
            alert(`Minimum sipariş: ${item.minSiparisKg} kg`);
            return;
        }
        if (item.maxSiparisKg && miktar > Number(item.maxSiparisKg)) {
            alert(`Maksimum sipariş: ${item.maxSiparisKg} kg`);
            return;
        }
        if (item.stokKg && miktar > Number(item.stokKg)) {
            alert('Stok yetersiz.');
            return;
        }

        try {
            await fetch('http://localhost:3030/api/ciftci/market/postMarketSiparisOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ciftciFirmaID: userInfo?.firmaID,
                    tedarikciID: item.tedarikciID,
                    yemID: item.yemID,
                    miktarKg: miktar,
                    planlananGirisTarihi: planlananGirisTarihi ? new Date(planlananGirisTarihi).toISOString() : undefined
                })
            });
            setSiparisMiktarlari((prev) => ({ ...prev, [key]: '' }));
            alert('Sipariş oluşturuldu.');
        } catch (err) {
            console.error('Sipariş oluşturulamadı:', err);
        }
    };

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Market')}</h5>
                    <button className="btn btn-outline-primary" onClick={fetchMarket} disabled={loading}>
                        {loading ? t('Yükleniyor...') : t('Yenile')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-1">{t('Arama')}</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Yem Türü')}</label>
                        <select className="form-select w-full" value={ozelYem} onChange={(e) => setOzelYem(e.target.value)}>
                            <option value="">{t('Tümü')}</option>
                            <option value="0">{t('Standart')}</option>
                            <option value="1">{t('Tedarikçi')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">{t('Tedarikçi')}</label>
                        <select className="form-select w-full" value={tedarikciID} onChange={(e) => setTedarikciID(e.target.value)}>
                            <option value="">{t('Tümü')}</option>
                            {tedarikciOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.adi}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">{t('Sıralama')}</label>
                        <select className="form-select w-full" value={siralama} onChange={(e) => setSiralama(e.target.value)}>
                            <option value="fiyat_asc">{t('Fiyat (Artan)')}</option>
                            <option value="fiyat_desc">{t('Fiyat (Azalan)')}</option>
                            <option value="stok_desc">{t('Stok (Yüksek)')}</option>
                            <option value="stok_asc">{t('Stok (Düşük)')}</option>
                            <option value="adi_desc">{t('İsim (Z-A)')}</option>
                            <option value="tedarikci_asc">{t('Tedarikçi (A-Z)')}</option>
                            <option value="tedarikci_desc">{t('Tedarikçi (Z-A)')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">{t('Min Fiyat')}</label>
                        <input type="number" className="form-input w-full" value={minFiyat} onChange={(e) => setMinFiyat(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Max Fiyat')}</label>
                        <input type="number" className="form-input w-full" value={maxFiyat} onChange={(e) => setMaxFiyat(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Min Stok')}</label>
                        <input type="number" className="form-input w-full" value={minStok} onChange={(e) => setMinStok(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Min Sipariş (kg)')}</label>
                        <input type="number" className="form-input w-full" value={minSiparisKg} onChange={(e) => setMinSiparisKg(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Max Sipariş (kg)')}</label>
                        <input type="number" className="form-input w-full" value={maxSiparisKg} onChange={(e) => setMaxSiparisKg(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Planlanan Giriş')}</label>
                        <input type="datetime-local" className="form-input w-full" value={planlananGirisTarihi} onChange={(e) => setPlanlananGirisTarihi(e.target.value)} />
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" className="form-checkbox" checked={stokVar} onChange={(e) => setStokVar(e.target.checked)} />
                        {t('Stokta olanları göster')}
                    </label>
                    <button className="btn btn-primary" onClick={fetchMarket}>
                        {t('Filtrele')}
                    </button>
                </div>
            </div>

            <div className="panel mb-5">
                <h5 className="text-lg font-semibold mb-4">{t('Market Ürünleri')}</h5>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Yem')}</th>
                                <th>{t('Tedarikçi')}</th>
                                <th>{t('Fiyat')}</th>
                                <th>{t('Stok')}</th>
                                <th>{t('Min / Max')}</th>
                                <th>{t('Tür')}</th>
                                <th>{t('Sipariş')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marketList.map((item) => {
                                const key = `${item.yemID}-${item.tedarikciID}`;
                                return (
                                    <tr key={key}>
                                        <td>{item.yemAdi}</td>
                                        <td>{item.tedarikciAdi}</td>
                                        <td>{item.birimFiyat}</td>
                                        <td>{item.stokKg ?? 0}</td>
                                        <td>
                                            {(item.minSiparisKg ?? 0)} / {(item.maxSiparisKg ?? '-')}
                                        </td>
                                        <td>{item.ozelYem ? t('Tedarikçi') : t('Standart')}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input w-32"
                                                value={siparisMiktarlari[key] || ''}
                                                onChange={(e) => setSiparisMiktarlari((prev) => ({ ...prev, [key]: e.target.value }))}
                                            />
                                        </td>
                                        <td className="flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchDetay(item)}>
                                                {t('Detay')}
                                            </button>
                                            <button className="btn btn-sm btn-primary" onClick={() => handleSiparisOlustur(item)}>
                                                {t('Sipariş Ver')}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {marketList.length === 0 && (
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

            {selectedDetay && (
                <div className="panel">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">{t('Ürün Detayı')}</h5>
                        <button className="btn btn-outline-secondary" onClick={() => setSelectedDetay(null)}>
                            {t('Kapat')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <div className="text-xs text-gray-500">{t('Yem')}</div>
                            <div className="font-semibold">{selectedDetay.yemAdi}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">{t('Tedarikçi')}</div>
                            <div className="font-semibold">{selectedDetay.tedarikciAdi}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">{t('Birim Fiyat')}</div>
                            <div className="font-semibold">{selectedDetay.birimFiyat}</div>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Besin')}</th>
                                    <th>{t('Miktar')}</th>
                                    <th>{t('Birim')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedDetay.besinDegerleri?.map((b) => (
                                    <tr key={b.besinDegeriID}>
                                        <td>{b.besinTipi}</td>
                                        <td>{b.miktar}</td>
                                        <td>{b.birimAdi}</td>
                                    </tr>
                                ))}
                                {(!selectedDetay.besinDegerleri || selectedDetay.besinDegerleri.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="text-center text-gray-500">
                                            {t('Besin değeri bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Market;

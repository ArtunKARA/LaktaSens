// UI/LaktaSense/src/pages/Cifci/Market/Market.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import Swal from 'sweetalert2';

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

    const buildPayload = () => {
        return {
            arama: arama || undefined,
            ozelYem: ozelYem !== '' ? ozelYem === '1' : undefined,
            tedarikciID: tedarikciID ? Number(tedarikciID) : undefined,
            minFiyat: minFiyat ? Number(minFiyat) : undefined,
            maxFiyat: maxFiyat ? Number(maxFiyat) : undefined,
            minStok: minStok ? Number(minStok) : undefined,
            minSiparisKg: minSiparisKg ? Number(minSiparisKg) : undefined,
            maxSiparisKg: maxSiparisKg ? Number(maxSiparisKg) : undefined,
            stokVar,
            siralama,
        };
    };

    const fetchMarket = async () => {
        setLoading(true);
        try {
            const payload = buildPayload();
            const res = await fetch('http://localhost:3030/api/ciftci/market/postMarketList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            setMarketList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Market listesi alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Market listesi alınamadı.' });
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
                body: JSON.stringify({ yemID: item.yemID, tedarikciID: item.tedarikciID }),
            });
            const data = await res.json();
            setSelectedDetay(data || null);
        } catch (err) {
            console.error('Market detay alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Detay alınamadı.' });
        }
    };

    const handleSiparisOlustur = async (item: MarketItem) => {
        const key = `${item.yemID}-${item.tedarikciID}`;
        const miktar = Number(siparisMiktarlari[key] || 0);

        if (!miktar || miktar <= 0) {
            Swal.fire({ icon: 'warning', title: 'Eksik bilgi', text: 'Sipariş miktarı zorunlu.' });
            return;
        }
        if (item.minSiparisKg && miktar < Number(item.minSiparisKg)) {
            Swal.fire({ icon: 'warning', title: 'Minimum sipariş', text: `Minimum sipariş: ${item.minSiparisKg} kg` });
            return;
        }
        if (item.maxSiparisKg && miktar > Number(item.maxSiparisKg)) {
            Swal.fire({ icon: 'warning', title: 'Maksimum sipariş', text: `Maksimum sipariş: ${item.maxSiparisKg} kg` });
            return;
        }
        if (item.stokKg && miktar > Number(item.stokKg)) {
            Swal.fire({ icon: 'warning', title: 'Stok yetersiz', text: 'Stok yetersiz.' });
            return;
        }

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Siparişi Onayla',
            html: `
              <div style="text-align:left;margin-top:10px">
                <div style="border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:16px;box-shadow:0 10px 28px rgba(0,0,0,.10);background:#fff">
                  <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06);margin-bottom:10px">
                    <span style="font-size:12px;color:#6b7280;font-weight:600">Yem</span>
                    <span style="font-size:13px;font-weight:700;color:#111827">${item.yemAdi}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06);margin-bottom:10px">
                    <span style="font-size:12px;color:#6b7280;font-weight:600">Tedarikçi</span>
                    <span style="font-size:13px;font-weight:700;color:#111827">${item.tedarikciAdi}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06);margin-bottom:10px">
                    <span style="font-size:12px;color:#6b7280;font-weight:600">Miktar</span>
                    <span style="font-size:13px;font-weight:800;color:#1d4ed8">${miktar} kg</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.06);margin-bottom:10px">
                    <span style="font-size:12px;color:#6b7280;font-weight:600">Planlanan Giriş</span>
                    <span style="font-size:13px;font-weight:700;color:#111827">${planlananGirisTarihi || '-'}</span>
                  </div>
                </div>
                <div style="margin-top:12px;font-size:12px;color:#6b7280">
                  Devam ederseniz sipariş oluşturulacaktır.
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Evet, Oluştur',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
        });

        if (!confirm.isConfirmed) return;

        try {
            await fetch('http://localhost:3030/api/ciftci/market/postMarketSiparisOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ciftciFirmaID: userInfo?.firmaID,
                    tedarikciID: item.tedarikciID,
                    yemID: item.yemID,
                    miktarKg: miktar,
                    planlananGirisTarihi: planlananGirisTarihi ? new Date(planlananGirisTarihi).toISOString() : undefined,
                }),
            });

            setSiparisMiktarlari((prev) => ({ ...prev, [key]: '' }));

            await Swal.fire({
                icon: 'success',
                title: 'Sipariş oluşturuldu',
                timer: 1200,
                showConfirmButton: false,
            });

            // istersen sipariş sonrası listeyi güncelleyebiliriz
            // fetchMarket();
        } catch (err) {
            console.error('Sipariş oluşturulamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Sipariş oluşturulamadı.' });
        }
    };

    const clearFilters = () => {
        setArama('');
        setOzelYem('');
        setTedarikciID('');
        setMinFiyat('');
        setMaxFiyat('');
        setMinStok('');
        setMinSiparisKg('');
        setMaxSiparisKg('');
        setStokVar(true);
        setSiralama('fiyat_asc');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h5 className="text-lg font-semibold">{t('Market')}</h5>
                        <p className="text-sm text-white-dark mt-1">
                            Yemleri filtrele, detayları görüntüle ve hızlıca sipariş oluştur.
                        </p>
                    </div>

                    <button className="btn btn-outline-primary" onClick={fetchMarket} disabled={loading}>
                        {loading ? t('Yükleniyor...') : t('Yenile')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h6 className="font-semibold">{t('Filtreler')}</h6>
                    <span className="text-xs text-white-dark">
                        {t('Kayıt')}: <b>{marketList.length}</b>
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Arama')}</label>
                        <input className="form-input w-full" value={arama} onChange={(e) => setArama(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Yem Türü')}</label>
                        <select className="form-select w-full" value={ozelYem} onChange={(e) => setOzelYem(e.target.value)}>
                            <option value="">{t('Tümü')}</option>
                            <option value="0">{t('Standart')}</option>
                            <option value="1">{t('Tedarikçi')}</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Tedarikçi')}</label>
                        <select className="form-select w-full" value={tedarikciID} onChange={(e) => setTedarikciID(e.target.value)}>
                            <option value="">{t('Tümü')}</option>
                            {tedarikciOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.adi}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Sıralama')}</label>
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

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Min Fiyat')}</label>
                        <input type="number" className="form-input w-full" value={minFiyat} onChange={(e) => setMinFiyat(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Max Fiyat')}</label>
                        <input type="number" className="form-input w-full" value={maxFiyat} onChange={(e) => setMaxFiyat(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Min Stok')}</label>
                        <input type="number" className="form-input w-full" value={minStok} onChange={(e) => setMinStok(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Min Sipariş (kg)')}</label>
                        <input type="number" className="form-input w-full" value={minSiparisKg} onChange={(e) => setMinSiparisKg(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Max Sipariş (kg)')}</label>
                        <input type="number" className="form-input w-full" value={maxSiparisKg} onChange={(e) => setMaxSiparisKg(e.target.value)} />
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                        <label className="block mb-1 text-xs font-semibold text-gray-600 dark:text-white-dark">{t('Planlanan Giriş')}</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={planlananGirisTarihi}
                            onChange={(e) => setPlanlananGirisTarihi(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-3 shadow-sm">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" className="form-checkbox" checked={stokVar} onChange={(e) => setStokVar(e.target.checked)} />
                        {t('Stokta olanları göster')}
                    </label>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-secondary" onClick={clearFilters} disabled={loading}>
                            {t('Temizle')}
                        </button>
                        <button className="btn btn-primary" onClick={fetchMarket} disabled={loading}>
                            {t('Filtrele')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Market Ürünleri')}</h5>
                    <span className="text-xs text-white-dark">
                        {t('Toplam')}: <b>{marketList.length}</b>
                    </span>
                </div>

                <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                    <div className="table-responsive">
                        <table className="table">
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
                                        <tr key={key} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                            <td className="whitespace-nowrap">
                                                <div className="font-semibold">{item.yemAdi}</div>
                                                <div className="text-xs text-white-dark">ID: {item.yemID}</div>
                                            </td>

                                            <td className="whitespace-nowrap">
                                                <div className="font-semibold">{item.tedarikciAdi}</div>
                                                <div className="text-xs text-white-dark">#{item.tedarikciID}</div>
                                            </td>

                                            <td className="whitespace-nowrap font-semibold">{item.birimFiyat}</td>

                                            <td className="whitespace-nowrap">
                                                <span className={`badge ${Number(item.stokKg ?? 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                    {item.stokKg ?? 0} kg
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap text-sm">
                                                <div className="text-white-dark text-xs">{t('Min')} / {t('Max')}</div>
                                                <div className="font-semibold">
                                                    {(item.minSiparisKg ?? 0)} / {(item.maxSiparisKg ?? '-')}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap">
                                                <span className={`badge ${item.ozelYem ? 'bg-primary' : 'bg-info'}`}>
                                                    {item.ozelYem ? t('Tedarikçi') : t('Standart')}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    className="form-input w-32"
                                                    value={siparisMiktarlari[key] || ''}
                                                    onChange={(e) =>
                                                        setSiparisMiktarlari((prev) => ({ ...prev, [key]: e.target.value }))
                                                    }
                                                />
                                            </td>

                                            <td className="whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchDetay(item)}>
                                                        {t('Detay')}
                                                    </button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleSiparisOlustur(item)}>
                                                        {t('Sipariş Ver')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {marketList.length === 0 && (
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

            {/* Detail */}
            {selectedDetay && (
                <div className="panel p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">{t('Ürün Detayı')}</h5>
                        <button className="btn btn-outline-secondary" onClick={() => setSelectedDetay(null)}>
                            {t('Kapat')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                            <div className="text-xs text-white-dark">{t('Yem')}</div>
                            <div className="font-semibold mt-1">{selectedDetay.yemAdi}</div>
                        </div>

                        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                            <div className="text-xs text-white-dark">{t('Tedarikçi')}</div>
                            <div className="font-semibold mt-1">{selectedDetay.tedarikciAdi}</div>
                        </div>

                        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/40 dark:bg-[#0e1726]/40 p-4 shadow-sm">
                            <div className="text-xs text-white-dark">{t('Birim Fiyat')}</div>
                            <div className="font-semibold mt-1">{selectedDetay.birimFiyat}</div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] overflow-hidden shadow-sm">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('Besin')}</th>
                                        <th>{t('Miktar')}</th>
                                        <th>{t('Birim')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDetay.besinDegerleri?.map((b) => (
                                        <tr key={b.besinDegeriID} className="hover:bg-gray-50 dark:hover:bg-[#0b1220]">
                                            <td className="font-semibold">{b.besinTipi}</td>
                                            <td>{b.miktar}</td>
                                            <td>{b.birimAdi}</td>
                                        </tr>
                                    ))}

                                    {(!selectedDetay.besinDegerleri || selectedDetay.besinDegerleri.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="text-center text-gray-500 py-8">
                                                {t('Besin değeri bulunamadı')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Market;
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { SingleValue, StylesConfig } from 'react-select';

interface IhaleDetay {
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
    tedarikciID: number;
    tedarikciAdi: string;
    teklifMiktarKg: number;
    birimFiyat: number;
    toplamTutar: number;
    teklifTarihi: string;
    durum: string;
    tedarikciToplamSiparis?: number;
    tedarikciTamamlananSiparis?: number;
    tedarikciBasariOrani?: number;
    tedarikciOrtalamaTeslimGun?: number;
}

interface IhaleDurumLog {
    logID: number;
    ihaleID: number;
    eskiDurum: string | null;
    yeniDurum: string;
    degisiklikTarihi: string;
    yapanKullaniciID?: number | null;
    yapanKullaniciAdi?: string | null;
    aciklama?: string | null;
}

interface TeklifAksiyonLog {
    logID: number;
    teklifID: number;
    ihaleID: number;
    tedarikciID: number;
    tedarikciAdi?: string | null;
    aksiyonTipi: string;
    eskiDurum?: string | null;
    yeniDurum?: string | null;
    teklifMiktarKg?: number | null;
    birimFiyat?: number | null;
    toplamTutar?: number | null;
    aksiyonTarihi: string;
    yapanKullaniciID?: number | null;
    yapanKullaniciAdi?: string | null;
    aciklama?: string | null;
}

interface OptionType {
    value: string;
    label: string;
}

const IhaleDetay = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { ihaleID } = useParams();
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [ihale, setIhale] = useState<IhaleDetay | null>(null);
    const [teklifler, setTeklifler] = useState<Teklif[]>([]);
    const [sortOption, setSortOption] = useState<OptionType | null>(null);
    const [durumFilter, setDurumFilter] = useState<OptionType | null>(null);
    const [basariPeriyot, setBasariPeriyot] = useState<OptionType | null>(null);
    const [planlananTarihler, setPlanlananTarihler] = useState<Record<number, string>>({});
    const [lastSelectionInfo, setLastSelectionInfo] = useState<string>('');
    const [compareIds, setCompareIds] = useState<number[]>([]);
    const [ihaleLoglari, setIhaleLoglari] = useState<IhaleDurumLog[]>([]);
    const [teklifLoglari, setTeklifLoglari] = useState<TeklifAksiyonLog[]>([]);

    const menuStyles: StylesConfig<OptionType, false> = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };

    useEffect(() => {
        dispatch(setPageTitle('İhale Detay'));
    }, [dispatch]);

    const fetchIhale = async () => {
        if (!ihaleID) return;
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDetay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ihaleID: Number(ihaleID) })
            });
            const data = await res.json();
            setIhale(data || null);
        } catch (err) {
            console.error('İhale detay alınamadı:', err);
        }
    };

    const fetchTeklifler = async () => {
        if (!ihaleID) return;
        try {
            const payload: any = { ihaleID: Number(ihaleID) };
            if (basariPeriyot?.value) payload.basariPeriyotAy = Number(basariPeriyot.value);
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleTeklifList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setTeklifler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Teklifler alınamadı:', err);
        }
    };

    const fetchIhaleLoglari = async () => {
        if (!ihaleID) return;
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDurumLogList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ihaleID: Number(ihaleID) })
            });
            const data = await res.json();
            setIhaleLoglari(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('İhale logları alınamadı:', err);
        }
    };

    const fetchTeklifLoglari = async () => {
        if (!ihaleID) return;
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/postTeklifAksiyonLogList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ihaleID: Number(ihaleID) })
            });
            const data = await res.json();
            setTeklifLoglari(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Teklif logları alınamadı:', err);
        }
    };

    useEffect(() => {
        fetchIhale();
        fetchIhaleLoglari();
        fetchTeklifLoglari();
    }, [ihaleID]);

    useEffect(() => {
        fetchTeklifler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ihaleID, basariPeriyot]);

    const getDefaultPlanDate = () => {
        const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const offset = target.getTimezoneOffset();
        const localDate = new Date(target.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (teklifler.length === 0) return;
        setPlanlananTarihler((prev) => {
            let changed = false;
            const next = { ...prev };
            teklifler.forEach((teklif) => {
                if (!next[teklif.teklifID]) {
                    next[teklif.teklifID] = getDefaultPlanDate();
                    changed = true;
                }
            });
            Object.keys(next).forEach((key) => {
                const teklifID = Number(key);
                if (!teklifler.some((t) => t.teklifID === teklifID)) {
                    delete next[teklifID];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [teklifler]);

    const teklifSec = async (teklif: Teklif) => {
        try {
            if (ihale) {
                const newRemaining = Number(ihale.kalanMiktarKg) - Number(teklif.teklifMiktarKg);
                const confirmMessage = `Bu teklif seçilirse kalan miktar ${newRemaining} kg olur. Onaylıyor musunuz?`;
                if (!window.confirm(confirmMessage)) return;
            }

            await fetch('http://localhost:3030/api/ciftci/ihale/postTeklifSec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teklifID: teklif.teklifID,
                    yapanKullaniciID: userInfo?.kullaniciID,
                    tahminiGirisTarihi: planlananTarihler[teklif.teklifID]
                        ? new Date(planlananTarihler[teklif.teklifID]).toISOString()
                        : undefined
                })
            });
            fetchIhale();
            fetchTeklifler();
            fetchIhaleLoglari();
            fetchTeklifLoglari();
            if (ihale) {
                const newRemaining = Number(ihale.kalanMiktarKg) - Number(teklif.teklifMiktarKg);
                setLastSelectionInfo(`Kalan miktar güncellendi: ${newRemaining} kg`);
            }
        } catch (err) {
            console.error('Teklif seçilemedi:', err);
        }
    };

    const teklifReddet = async (teklifID: number) => {
        try {
            await fetch('http://localhost:3030/api/ciftci/ihale/postTeklifReddet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teklifID, yapanKullaniciID: userInfo?.kullaniciID })
            });
            fetchTeklifler();
            fetchTeklifLoglari();
        } catch (err) {
            console.error('Teklif reddedilemedi:', err);
        }
    };

    const durumGuncelle = async (durum: 'k' | 'i') => {
        if (!ihaleID) return;
        try {
            await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ihaleID: Number(ihaleID),
                    durum,
                    yapanKullaniciID: userInfo?.kullaniciID,
                    aciklama: durum === 'k' ? 'Çiftçi ihale kapattı' : 'Çiftçi ihale iptal etti'
                })
            });
            fetchIhale();
            fetchIhaleLoglari();
        } catch (err) {
            console.error('İhale durumu güncellenemedi:', err);
        }
    };

    const teklifDurumText = (durum: string) => {
        if (durum === 'b') return 'Beklemede';
        if (durum === 's') return 'Seçildi';
        if (durum === 'r') return 'Reddedildi';
        if (durum === 'c') return 'Çekildi';
        return durum;
    };

    const durumText = (durum: string) => {
        if (durum === 'a') return 'Açık';
        if (durum === 'k') return 'Kapalı';
        if (durum === 't') return 'Tamamlandı';
        if (durum === 'i') return 'İptal';
        return durum;
    };

    const aksiyonText = (aksiyon: string) => {
        if (aksiyon === 'olustur') return 'Teklif Oluştur';
        if (aksiyon === 'guncelle') return 'Teklif Güncelle';
        if (aksiyon === 'cek') return 'Teklif Çek';
        if (aksiyon === 'sec') return 'Teklif Seç';
        if (aksiyon === 'reddet') return 'Teklif Reddet';
        return aksiyon;
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR');
    };

    const sortOptions = useMemo<OptionType[]>(
        () => [
            { value: 'best_mix', label: t('En İyi Kombinasyon') },
            { value: 'price_asc', label: t('Fiyat (Artan)') },
            { value: 'price_desc', label: t('Fiyat (Azalan)') },
            { value: 'amount_asc', label: t('Miktar (Artan)') },
            { value: 'amount_desc', label: t('Miktar (Azalan)') },
            { value: 'total_asc', label: t('Toplam (Artan)') },
            { value: 'total_desc', label: t('Toplam (Azalan)') },
            { value: 'date_desc', label: t('Tarihe göre (Yeni)') },
            { value: 'date_asc', label: t('Tarihe göre (Eski)') }
        ],
        [t]
    );

    useEffect(() => {
        if (!sortOption && sortOptions.length > 0) setSortOption(sortOptions[0]);
    }, [sortOption, sortOptions]);

    const durumOptions = useMemo<OptionType[]>(
        () => [
            { value: '', label: t('Tümü') },
            { value: 'b', label: t('Beklemede') },
            { value: 's', label: t('Seçildi') },
            { value: 'r', label: t('Reddedildi') },
            { value: 'c', label: t('Çekildi') }
        ],
        [t]
    );

    const periyotOptions = useMemo<OptionType[]>(
        () => [
            { value: '', label: t('Tümü') },
            { value: '3', label: t('Son 3 Ay') },
            { value: '6', label: t('Son 6 Ay') }
        ],
        [t]
    );

    const minBirimFiyat = useMemo(() => {
        const aktifTeklifler = teklifler.filter((t) => t.durum === 'b');
        if (aktifTeklifler.length === 0) return null;
        return Math.min(...aktifTeklifler.map((t) => Number(t.birimFiyat)));
    }, [teklifler]);

    const recommendation = useMemo(() => {
        if (!ihale) return null;
        const kalan = Number(ihale.kalanMiktarKg);
        if (kalan <= 0) return null;

        const adaylar = [...teklifler]
            .filter((t) => t.durum === 'b')
            .sort((a, b) => Number(a.birimFiyat) - Number(b.birimFiyat));

        let kalanMiktar = kalan;
        let toplamTutar = 0;
        const secimler: Teklif[] = [];

        for (const teklif of adaylar) {
            const teklifMiktar = Number(teklif.teklifMiktarKg);
            if (kalanMiktar <= 0) break;
            if (teklifMiktar > kalanMiktar) continue;
            secimler.push(teklif);
            toplamTutar += Number(teklif.toplamTutar);
            kalanMiktar -= teklifMiktar;
        }

        const kapanan = kalan - kalanMiktar;
        const oran = kalan > 0 ? Math.round((kapanan / kalan) * 100) : 0;

        return {
            kalan,
            secimler,
            toplamTutar,
            kalanSonra: kalanMiktar,
            kapanmaOrani: oran
        };
    }, [teklifler, ihale]);

    const sortedTeklifler = useMemo(() => {
        let list = [...teklifler];
        if (durumFilter?.value) {
            list = list.filter((t) => t.durum === durumFilter.value);
        }

        switch (sortOption?.value) {
            case 'best_mix':
                list.sort((a, b) => {
                    const priceDiff = Number(a.birimFiyat) - Number(b.birimFiyat);
                    if (priceDiff !== 0) return priceDiff;
                    return Number(b.tedarikciBasariOrani ?? 0) - Number(a.tedarikciBasariOrani ?? 0);
                });
                break;
            case 'price_asc':
                list.sort((a, b) => Number(a.birimFiyat) - Number(b.birimFiyat));
                break;
            case 'price_desc':
                list.sort((a, b) => Number(b.birimFiyat) - Number(a.birimFiyat));
                break;
            case 'amount_asc':
                list.sort((a, b) => Number(a.teklifMiktarKg) - Number(b.teklifMiktarKg));
                break;
            case 'amount_desc':
                list.sort((a, b) => Number(b.teklifMiktarKg) - Number(a.teklifMiktarKg));
                break;
            case 'total_asc':
                list.sort((a, b) => Number(a.toplamTutar) - Number(b.toplamTutar));
                break;
            case 'total_desc':
                list.sort((a, b) => Number(b.toplamTutar) - Number(a.toplamTutar));
                break;
            case 'date_asc':
                list.sort((a, b) => new Date(a.teklifTarihi).getTime() - new Date(b.teklifTarihi).getTime());
                break;
            case 'date_desc':
            default:
                list.sort((a, b) => new Date(b.teklifTarihi).getTime() - new Date(a.teklifTarihi).getTime());
                break;
        }
        return list;
    }, [teklifler, sortOption, durumFilter]);

    const compareList = useMemo(() => teklifler.filter((t) => compareIds.includes(t.teklifID)), [teklifler, compareIds]);

    const toggleCompare = (teklifID: number) => {
        setCompareIds((prev) => {
            if (prev.includes(teklifID)) return prev.filter((id) => id !== teklifID);
            if (prev.length >= 3) {
                alert('En fazla 3 teklif karşılaştırılabilir.');
                return prev;
            }
            return [...prev, teklifID];
        });
    };

    const getBasariBadge = (teklif: Teklif) => {
        const toplam = Number(teklif.tedarikciToplamSiparis ?? 0);
        const tamamlanan = Number(teklif.tedarikciTamamlananSiparis ?? 0);
        if (toplam <= 0) {
            return { className: 'badge bg-secondary', label: t('Yeni'), hint: t('Henüz sipariş yok') };
        }
        const oran = Number(teklif.tedarikciBasariOrani ?? 0);
        let className = 'badge bg-danger';
        if (oran >= 80) className = 'badge bg-success';
        else if (oran >= 50) className = 'badge bg-warning';
        return {
            className,
            label: `${oran.toFixed(0)}%`,
            hint: `${t('Tamamlanan')}: ${tamamlanan} / ${toplam}`
        };
    };

    const getNextSuggestion = (current: Teklif, kalanSonra: number) => {
        return teklifler
            .filter((t) => t.durum === 'b' && t.teklifID !== current.teklifID && Number(t.teklifMiktarKg) <= kalanSonra)
            .sort((a, b) => Number(a.birimFiyat) - Number(b.birimFiyat))[0];
    };

    const handleKopya = () => {
        if (!ihale) return;
        navigate('/cifci/tedarik/ihale-baslat', {
            state: {
                copyFrom: {
                    ihaleAdi: ihale.ihaleAdi,
                    aciklama: ihale.aciklama,
                    yemID: ihale.yemID,
                    talepMiktarKg: ihale.talepMiktarKg
                }
            }
        });
    };

    return (
        <div>
            <div className="panel mb-5">
                <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold">{t('İhale Detay')}</h5>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={() => navigate('/cifci/tedarik/ihalelerim')}>
                            {t('Geri')}
                        </button>
                        <button className="btn btn-outline-secondary" onClick={handleKopya}>
                            {t('Yeni İhale (Kopya)')}
                        </button>
                    </div>
                </div>
                {ihale ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <div className="text-sm text-gray-500">{t('İhale')}</div>
                            <div className="font-semibold">{ihale.ihaleAdi || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('Durum')}</div>
                            <div className="font-semibold">{durumText(ihale.durum)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('Yem')}</div>
                            <div className="font-semibold">{ihale.yemAdi}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('Talep')}</div>
                            <div className="font-semibold">{ihale.talepMiktarKg} kg</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('Kalan')}</div>
                            <div className="font-semibold">{ihale.kalanMiktarKg} kg</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('Açıklama')}</div>
                            <div className="font-semibold">{ihale.aciklama || '-'}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 mt-4">{t('İhale bulunamadı')}</div>
                )}

                {ihale?.durum === 'a' && (
                    <div className="mt-4 flex gap-2">
                        <button className="btn btn-outline-warning" onClick={() => durumGuncelle('k')}>
                            {t('Kalanı Kapat')}
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => durumGuncelle('i')}>
                            {t('İhale İptal')}
                        </button>
                    </div>
                )}
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold">{t('Teklifler')}</h5>
                    <div className="flex items-center gap-2">
                        <div className="min-w-[200px]">
                            <Select
                                options={durumOptions}
                                value={durumFilter}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                styles={menuStyles}
                                onChange={(selected: SingleValue<OptionType>) => setDurumFilter(selected)}
                                placeholder={t('Durum')}
                                isSearchable={false}
                                isClearable={true}
                            />
                        </div>
                        <div className="min-w-[200px]">
                            <Select
                                options={periyotOptions}
                                value={basariPeriyot}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                styles={menuStyles}
                                onChange={(selected: SingleValue<OptionType>) => setBasariPeriyot(selected)}
                                placeholder={t('Performans Dönemi')}
                                isSearchable={false}
                                isClearable={true}
                            />
                        </div>
                        <div className="min-w-[220px]">
                            <Select
                                options={sortOptions}
                                value={sortOption}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                styles={menuStyles}
                                onChange={(selected: SingleValue<OptionType>) => setSortOption(selected)}
                                placeholder={t('Sıralama')}
                                isSearchable={true}
                                isClearable={false}
                            />
                        </div>
                        <button className="btn btn-outline-primary" onClick={fetchTeklifler}>
                            {t('Yenile')}
                        </button>
                    </div>
                </div>
                {lastSelectionInfo && (
                    <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700">
                        {lastSelectionInfo}
                    </div>
                )}
                {ihale && (
                    <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                        {ihale.kalanMiktarKg > 0
                            ? `Kalan miktar: ${ihale.kalanMiktarKg} kg. Kısmi seçim yapılabilir.`
                            : 'İhale tamamlandı, kalan miktar yok.'}
                    </div>
                )}
                {recommendation && (
                    <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
                        {recommendation.secimler.length > 0 ? (
                            <>
                                <div className="font-semibold">{t('Öneri')}: {t('En uygun fiyat ile kalan miktarı kapatmak için')}:</div>
                                <div className="text-sm">
                                    {recommendation.secimler.map((t) => `${t.tedarikciAdi} (${t.teklifMiktarKg} kg @ ${t.birimFiyat})`).join(', ')}
                                </div>
                                <div className="text-sm">
                                    {t('Tahmini toplam')}: {recommendation.toplamTutar.toFixed(2)}
                                </div>
                                <div className="text-xs text-amber-700">
                                    {t('Kapanma oranı')}: %{recommendation.kapanmaOrani}
                                </div>
                                {recommendation.kalanSonra > 0 && (
                                    <div className="text-xs text-amber-700">
                                        {t('Mevcut teklifler kalan miktarı tamamen kapatmıyor. Eksik')}: {recommendation.kalanSonra} kg
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm">{t('Öneri üretilemedi: uygun teklif bulunamadı.')}</div>
                        )}
                    </div>
                )}
                {compareList.length > 0 && (
                    <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{t('Teklif Karşılaştırma')}</div>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setCompareIds([])}>
                                {t('Temizle')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {compareList.map((tkl) => (
                                <div key={`cmp-${tkl.teklifID}`} className="rounded border border-slate-200 bg-white p-3">
                                    <div className="font-semibold mb-1">{tkl.tedarikciAdi}</div>
                                    <div>{t('Miktar')}: {tkl.teklifMiktarKg}</div>
                                    <div>{t('Birim Fiyat')}: {tkl.birimFiyat}</div>
                                    <div>{t('Toplam')}: {tkl.toplamTutar}</div>
                                    <div>{t('Başarı')}: {(tkl.tedarikciBasariOrani ?? 0).toFixed(0)}%</div>
                                    <div>{t('Teslim (gün)')}: {(tkl.tedarikciOrtalamaTeslimGun ?? 0).toFixed(1)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Karşılaştır')}</th>
                                <th>{t('Teklif ID')}</th>
                                <th>{t('Tedarikçi')}</th>
                                <th>{t('Başarı')}</th>
                                <th>{t('Teslim (gün)')}</th>
                                <th>{t('Miktar')}</th>
                                <th>{t('Birim Fiyat')}</th>
                                <th>{t('Toplam')}</th>
                                <th>{t('Durum')}</th>
                                <th>{t('Planlanan Giriş')}</th>
                                <th>{t('İşlem')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeklifler.map((teklif) => {
                                const kalanSonra = ihale ? Number(ihale.kalanMiktarKg) - Number(teklif.teklifMiktarKg) : null;
                                const canSelect =
                                    teklif.durum === 'b' &&
                                    ihale?.durum === 'a' &&
                                    ihale &&
                                    Number(teklif.teklifMiktarKg) <= Number(ihale.kalanMiktarKg);
                                const isBestPrice = minBirimFiyat !== null && Number(teklif.birimFiyat) === Number(minBirimFiyat);
                                const basari = getBasariBadge(teklif);
                                const nextSuggestion = kalanSonra !== null && kalanSonra > 0 ? getNextSuggestion(teklif, kalanSonra) : null;
                                const isPlanEditable = teklif.durum === 'b' && ihale?.durum === 'a';
                                const planValue = planlananTarihler[teklif.teklifID] || '';
                                return (
                                    <tr key={teklif.teklifID}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-checkbox"
                                                checked={compareIds.includes(teklif.teklifID)}
                                                onChange={() => toggleCompare(teklif.teklifID)}
                                            />
                                        </td>
                                        <td>{teklif.teklifID}</td>
                                        <td>{teklif.tedarikciAdi}</td>
                                        <td>
                                            <span className={basari.className} title={basari.hint}>
                                                {basari.label}
                                            </span>
                                        </td>
                                        <td>{(teklif.tedarikciOrtalamaTeslimGun ?? 0).toFixed(1)}</td>
                                        <td>{teklif.teklifMiktarKg}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span>{teklif.birimFiyat}</span>
                                                {isBestPrice && (
                                                    <span className="badge bg-success" title={t('Aktif teklifler içinde en düşük birim fiyat')}>
                                                        {t('En Uygun Fiyat')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{teklif.toplamTutar}</td>
                                        <td>{teklifDurumText(teklif.durum)}</td>
                                        <td>
                                            <input
                                                type="datetime-local"
                                                className="form-input min-w-[200px]"
                                                value={planValue}
                                                onChange={(e) =>
                                                    setPlanlananTarihler((prev) => ({
                                                        ...prev,
                                                        [teklif.teklifID]: e.target.value
                                                    }))
                                                }
                                                disabled={!isPlanEditable}
                                            />
                                        </td>
                                        <td>
                                            {teklif.durum === 'b' && ihale?.durum === 'a' && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-primary" onClick={() => teklifSec(teklif)} disabled={!canSelect}>
                                                            {t('Seç')}
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => teklifReddet(teklif.teklifID)}>
                                                            {t('Reddet')}
                                                        </button>
                                                    </div>
                                                    {kalanSonra !== null && (
                                                        <div className="text-xs text-gray-500">
                                                            {canSelect
                                                                ? `Seçim sonrası kalan: ${kalanSonra} kg`
                                                                : 'Teklif miktarı kalan miktarı aşıyor'}
                                                        </div>
                                                    )}
                                                    {canSelect && nextSuggestion && (
                                                        <div className="text-xs text-gray-500">
                                                            {t('Kalanı tamamlamak için öneri')}: {nextSuggestion.tedarikciAdi} ({nextSuggestion.teklifMiktarKg} kg)
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {sortedTeklifler.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="text-center text-gray-500">
                                        {t('Teklif bulunamadı')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                <div className="panel">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">{t('İhale Durum Logları')}</h5>
                        <button className="btn btn-outline-primary" onClick={fetchIhaleLoglari}>
                            {t('Yenile')}
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Tarih')}</th>
                                    <th>{t('Eski Durum')}</th>
                                    <th>{t('Yeni Durum')}</th>
                                    <th>{t('Kullanıcı')}</th>
                                    <th>{t('Açıklama')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ihaleLoglari.map((log) => (
                                    <tr key={`ihale-log-${log.logID}`}>
                                        <td>{formatDate(log.degisiklikTarihi)}</td>
                                        <td>{log.eskiDurum ? durumText(log.eskiDurum) : '-'}</td>
                                        <td>{durumText(log.yeniDurum)}</td>
                                        <td>{log.yapanKullaniciAdi || '-'}</td>
                                        <td>{log.aciklama || '-'}</td>
                                    </tr>
                                ))}
                                {ihaleLoglari.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center text-gray-500">
                                            {t('Kayıt bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">{t('Teklif Aksiyon Logları')}</h5>
                        <button className="btn btn-outline-primary" onClick={fetchTeklifLoglari}>
                            {t('Yenile')}
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Tarih')}</th>
                                    <th>{t('Teklif ID')}</th>
                                    <th>{t('Tedarikçi')}</th>
                                    <th>{t('Aksiyon')}</th>
                                    <th>{t('Durum')}</th>
                                    <th>{t('Kullanıcı')}</th>
                                    <th>{t('Açıklama')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teklifLoglari.map((log) => (
                                    <tr key={`teklif-log-${log.logID}`}>
                                        <td>{formatDate(log.aksiyonTarihi)}</td>
                                        <td>{log.teklifID}</td>
                                        <td>{log.tedarikciAdi || '-'}</td>
                                        <td>{aksiyonText(log.aksiyonTipi)}</td>
                                        <td>
                                            {log.eskiDurum ? teklifDurumText(log.eskiDurum) : '-'} → {log.yeniDurum ? teklifDurumText(log.yeniDurum) : '-'}
                                        </td>
                                        <td>{log.yapanKullaniciAdi || '-'}</td>
                                        <td>{log.aciklama || '-'}</td>
                                    </tr>
                                ))}
                                {teklifLoglari.length === 0 && (
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
        </div>
    );
};

export default IhaleDetay;

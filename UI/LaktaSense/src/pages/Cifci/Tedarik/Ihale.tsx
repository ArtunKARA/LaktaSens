import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import Select, { SingleValue, StylesConfig, ActionMeta } from 'react-select';
import Swal from 'sweetalert2';

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

type OptionType = { value: string; label: string };

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
    const [loading, setLoading] = useState(false);
    type ViewMode = 'grid' | 'list';

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const raw = localStorage.getItem('ihaleViewMode');
        return raw === 'list' ? 'list' : 'grid';
    });

    useEffect(() => {
        localStorage.setItem('ihaleViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        dispatch(setPageTitle('İhalelerim'));
    }, [dispatch]);

    // ====== UI Helpers (Aynı stil) ======
    const FieldBox = ({ children }: { children: React.ReactNode }) => (
        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/50 dark:bg-white/[0.02] p-4">
            {children}
        </div>
    );

    const SectionBox = ({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
        <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-black p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h6 className="font-semibold">{title}</h6>
                </div>
                {right}
            </div>
            {children}
        </div>
    );

    // ====== react-select styles ======
    const menuStyles: StylesConfig<OptionType, false> = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 10,
            borderColor: state.isFocused ? 'rgba(59,130,246,0.6)' : (base.borderColor as any),
            boxShadow: state.isFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        }),
        valueContainer: (base) => ({ ...base, padding: '0 10px' }),
    };

    const durumOptions: OptionType[] = useMemo(
        () => [
            { value: '', label: t('Tümü') },
            { value: 'a', label: t('Açık') },
            { value: 'k', label: t('Kapalı') },
            { value: 't', label: t('Tamamlandı') },
            { value: 'i', label: t('İptal') },
        ],
        [t],
    );

    // ====== LocalStorage filtre restore ======
    useEffect(() => {
        const raw = localStorage.getItem('ihaleListFilters');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.baslangicTarihi) setBaslangicTarihi(parsed.baslangicTarihi);
            if (parsed?.bitisTarihi) setBitisTarihi(parsed.bitisTarihi);
            if (parsed?.durum) {
                const found = durumOptions.find((o) => o.value === parsed.durum);
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
            durum: durumFilter?.value || '',
        });
        localStorage.setItem('ihaleListFilters', value);
    }, [baslangicTarihi, bitisTarihi, durumFilter]);

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR');
    };

    const durumText = (durum: string) => {
        if (durum === 'a') return t('Açık');
        if (durum === 'k') return t('Kapalı');
        if (durum === 't') return t('Tamamlandı');
        if (durum === 'i') return t('İptal');
        return durum;
    };

    const getDurumBadge = (durum: string) => {
        if (durum === 'a') return 'badge bg-primary';
        if (durum === 'k') return 'badge bg-secondary';
        if (durum === 't') return 'badge bg-success';
        if (durum === 'i') return 'badge bg-danger';
        return 'badge bg-dark';
    };

    const getKalanBadge = (kalan: number, talep: number) => {
        const kalanValue = Number(kalan);
        const talepValue = Number(talep);
        if (kalanValue <= 0) return { className: 'badge bg-success', label: t('Tamamlandı') };
        const oran = talepValue > 0 ? kalanValue / talepValue : 1;
        if (oran <= 0.2) return { className: 'badge bg-warning', label: `${kalanValue} kg - ${t('Az Kaldı')}` };
        return { className: 'badge bg-info', label: `${kalanValue} kg` };
    };

    const fetchIhaleler = async () => {
        setLoading(true);
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
                body: JSON.stringify(body),
            });

            const data = await res.json();
            setIhaleler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('İhaleler alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'İhaleler alınamadı.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIhaleler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [durumFilter, baslangicTarihi, bitisTarihi, userInfo?.firmaID]);

    const durumGuncelle = async (ihaleID: number, durum: 'k' | 'i', aciklama: string) => {
        const confirm = await Swal.fire({
            icon: 'question',
            title: durum === 'k' ? 'İhaleyi kapatmak istiyor musunuz?' : 'İhaleyi iptal etmek istiyor musunuz?',
            text: 'Bu işlem geri alınamaz.',
            showCancelButton: true,
            confirmButtonText: durum === 'k' ? 'Evet, Kapat' : 'Evet, İptal Et',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: durum === 'k' ? '#f59e0b' : '#ef4444',
            cancelButtonColor: '#6b7280',
        });

        if (!confirm.isConfirmed) return;

        try {
            await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleDurumGuncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ihaleID,
                    durum,
                    yapanKullaniciID: userInfo?.kullaniciID,
                    aciklama,
                }),
            });

            Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 900, showConfirmButton: false });
            fetchIhaleler();
        } catch (err) {
            console.error('Durum güncellenemedi:', err);
            Swal.fire({ icon: 'error', title: 'Hata', text: 'İşlem yapılamadı.' });
        }
    };

    // ====== küçük özetler ======
    const stats = useMemo(() => {
        const total = ihaleler.length;
        const acik = ihaleler.filter((x) => x.durum === 'a').length;
        const tamam = ihaleler.filter((x) => x.durum === 't').length;
        const iptal = ihaleler.filter((x) => x.durum === 'i').length;
        return { total, acik, tamam, iptal };
    }, [ihaleler]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="panel p-5 border border-white-light dark:border-[#1b2e4b]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h5 className="text-lg font-semibold">{t('İhalelerim')}</h5>
                        <p className="text-sm text-white-dark mt-1">
                            Filtreleyin, ihalelerinizi hızlıca görün ve detaylara geçin.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline-primary" onClick={fetchIhaleler} disabled={loading}>
                            {loading ? t('Yükleniyor...') : t('Yenile')}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/cifci/tedarik/ihale-baslat')}>
                            {t('Yeni İhale')}
                        </button>
                    </div>
                </div>

                {/* mini stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                        <div className="text-xs text-white-dark">{t('Toplam')}</div>
                        <div className="text-lg font-semibold">{stats.total}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                        <div className="text-xs text-white-dark">{t('Açık')}</div>
                        <div className="text-lg font-semibold">{stats.acik}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                        <div className="text-xs text-white-dark">{t('Tamamlandı')}</div>
                        <div className="text-lg font-semibold">{stats.tamam}</div>
                    </div>
                    <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                        <div className="text-xs text-white-dark">{t('İptal')}</div>
                        <div className="text-lg font-semibold">{stats.iptal}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <SectionBox
                title={t('Filtreler')}
                right={
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                            setBaslangicTarihi('');
                            setBitisTarihi('');
                            setDurumFilter(null);
                        }}
                        disabled={loading}
                    >
                        {t('Temizle')}
                    </button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FieldBox>
                        <label className="form-label">{t('Başlangıç Tarihi')}</label>
                        <input
                            type="date"
                            className="form-input w-full"
                            value={baslangicTarihi}
                            onChange={(e) => setBaslangicTarihi(e.target.value)}
                        />
                    </FieldBox>

                    <FieldBox>
                        <label className="form-label">{t('Bitiş Tarihi')}</label>
                        <input
                            type="date"
                            className="form-input w-full"
                            value={bitisTarihi}
                            onChange={(e) => setBitisTarihi(e.target.value)}
                        />
                    </FieldBox>

                    <FieldBox>
                        <label className="form-label">{t('Durum')}</label>
                        <Select<OptionType, false>
                            options={durumOptions}
                            value={durumFilter}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                            styles={menuStyles}
                            onChange={(selected: SingleValue<OptionType>, _action: ActionMeta<OptionType>) => setDurumFilter(selected)}
                            placeholder={t('Seçiniz')}
                            isSearchable
                            isClearable
                        />
                    </FieldBox>

                    <FieldBox>
                        <label className="form-label">{t('Görünüm')}</label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`btn w-full ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                {t('Grid')}
                            </button>

                            <button
                                type="button"
                                className={`btn w-full ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setViewMode('list')}
                            >
                                {t('Liste')}
                            </button>
                        </div>

                        <div className="text-xs text-white-dark mt-2">
                            {viewMode === 'grid' ? t('Kart görünümünde gösteriliyor.') : t('Tablo görünümünde gösteriliyor.')}
                        </div>
                    </FieldBox>
                </div>
            </SectionBox>

            {/* Cards */}
            {viewMode === 'grid' && (
                <SectionBox title={t('Özet Kartlar')}>
                    {ihaleler.length === 0 ? (
                        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-6 text-center text-white-dark">
                            {loading ? t('Yükleniyor...') : t('Kayıt bulunamadı')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ihaleler.map((ihale) => {
                                const kalanBadge = getKalanBadge(ihale.kalanMiktarKg, ihale.talepMiktarKg);
                                return (
                                    <div key={`card-${ihale.ihaleID}`} className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-black p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold leading-snug">{ihale.ihaleAdi || t('İhale')}</div>
                                                <div className="text-sm text-white-dark mt-1">{ihale.yemAdi}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={kalanBadge.className}>{kalanBadge.label}</span>
                                                <span className={`${getDurumBadge(ihale.durum)}`}>{durumText(ihale.durum)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                                                <div className="text-xs text-white-dark">{t('En Düşük Fiyat')}</div>
                                                <div className="font-semibold">{ihale.enDusukBirimFiyat ?? '-'}</div>
                                            </div>
                                            <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                                                <div className="text-xs text-white-dark">{t('Teklif Sayısı')}</div>
                                                <div className="font-semibold">{ihale.teklifSayisi ?? 0}</div>
                                            </div>
                                            <div className="col-span-2 rounded-xl border border-white-light dark:border-[#1b2e4b] p-3">
                                                <div className="text-xs text-white-dark">{t('Son Teklif')}</div>
                                                <div className="font-semibold">{formatDate(ihale.sonTeklifTarihi)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end gap-2">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/cifci/tedarik/ihale/${ihale.ihaleID}`)}>
                                                {t('Detay')}
                                            </button>

                                            {ihale.durum === 'a' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => durumGuncelle(ihale.ihaleID, 'k', 'Çiftçi ihale kapattı')}
                                                    >
                                                        {t('Kapat')}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => durumGuncelle(ihale.ihaleID, 'i', 'Çiftçi ihale iptal etti')}
                                                    >
                                                        {t('İptal')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SectionBox>
            )}

            {/* Table */}
            {viewMode === 'list' && (
                <SectionBox title={t('Tüm Liste')}>
                    <div className="table-responsive rounded-2xl border border-white-light dark:border-[#1b2e4b] overflow-hidden">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('ID')}</th>
                                    <th>{t('İhale')}</th>
                                    <th>{t('Yem')}</th>
                                    <th>{t('Talep')}</th>
                                    <th>{t('Kalan')}</th>
                                    <th>{t('Durum')}</th>
                                    <th className="!text-right">{t('İşlem')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ihaleler.map((ihale) => {
                                    const kalanBadge = getKalanBadge(ihale.kalanMiktarKg, ihale.talepMiktarKg);
                                    return (
                                        <tr key={ihale.ihaleID}>
                                            <td className="font-semibold">{ihale.ihaleID}</td>
                                            <td>
                                                <div className="font-semibold">{ihale.ihaleAdi || '-'}</div>
                                                <div className="text-xs text-white-dark">
                                                    {t('Başlangıç')}: {formatDate(ihale.ihaleBaslangicTarihi)} • {t('Bitiş')}: {formatDate(ihale.ihaleBitisTarihi)}
                                                </div>
                                            </td>
                                            <td>{ihale.yemAdi}</td>
                                            <td>{ihale.talepMiktarKg} kg</td>
                                            <td>
                                                <span className={kalanBadge.className}>{kalanBadge.label}</span>
                                            </td>
                                            <td>
                                                <span className={getDurumBadge(ihale.durum)}>{durumText(ihale.durum)}</span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/cifci/tedarik/ihale/${ihale.ihaleID}`)}>
                                                        {t('Detay')}
                                                    </button>
                                                    {ihale.durum === 'a' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-outline-warning"
                                                                onClick={() => durumGuncelle(ihale.ihaleID, 'k', 'Çiftçi ihale kapattı')}
                                                            >
                                                                {t('Kapat')}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => durumGuncelle(ihale.ihaleID, 'i', 'Çiftçi ihale iptal etti')}
                                                            >
                                                                {t('İptal')}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {ihaleler.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-white-dark py-8">
                                            {loading ? t('Yükleniyor...') : t('Kayıt bulunamadı')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionBox>
            )}
        </div>
    );
};

export default Ihalelerim;
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import Select, { SingleValue, StylesConfig } from 'react-select';

interface Yem {
    yemID: number;
    yemAdi: string;
}

interface OptionType {
    value: string;
    label: string;
}

const IhaleBaslat = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [yemler, setYemler] = useState<Yem[]>([]);
    const [form, setForm] = useState({
        ihaleAdi: '',
        ihaleBaslangicTarihi: '',
        ihaleBitisTarihi: '',
        aciklama: '',
        yemID: '',
        talepMiktarKg: ''
    });
    const menuStyles: StylesConfig<OptionType, false> = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };

    useEffect(() => {
        dispatch(setPageTitle('İhale Başlat'));
    }, [dispatch]);

    useEffect(() => {
        const copyFrom = (location.state as any)?.copyFrom;
        if (!copyFrom) return;
        setForm((prev) => ({
            ...prev,
            ihaleAdi: copyFrom.ihaleAdi || '',
            aciklama: copyFrom.aciklama || '',
            yemID: copyFrom.yemID ? String(copyFrom.yemID) : '',
            talepMiktarKg: copyFrom.talepMiktarKg ? String(copyFrom.talepMiktarKg) : ''
        }));
    }, [location.state]);

    const fetchYemler = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/getYemTanimlari');
            const data = await res.json();
            setYemler(data || []);
        } catch (err) {
            console.error('Yemler alınamadı:', err);
        }
    };

    useEffect(() => {
        fetchYemler();
    }, []);

    const submitIhale = async () => {
        if (!form.yemID || !form.talepMiktarKg || !form.ihaleBaslangicTarihi || !form.ihaleBitisTarihi) {
            alert('Zorunlu alanları doldurun.');
            return;
        }

        try {
            const payload = {
                acanFirmaID: userInfo?.firmaID,
                ihaleAdi: form.ihaleAdi,
                ihaleBaslangicTarihi: new Date(form.ihaleBaslangicTarihi).toISOString(),
                ihaleBitisTarihi: new Date(form.ihaleBitisTarihi).toISOString(),
                aciklama: form.aciklama,
                yemID: Number(form.yemID),
                talepMiktarKg: Number(form.talepMiktarKg),
                yapanKullaniciID: userInfo?.kullaniciID
            };

            await fetch('http://localhost:3030/api/ciftci/ihale/postIhaleOlustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setForm({
                ihaleAdi: '',
                ihaleBaslangicTarihi: '',
                ihaleBitisTarihi: '',
                aciklama: '',
                yemID: '',
                talepMiktarKg: ''
            });

            navigate('/cifci/tedarik/ihalelerim');
        } catch (err) {
            console.error('İhale oluşturulamadı:', err);
        }
    };

    return (
        <div>
            <div className="panel">
                <h5 className="text-lg font-semibold mb-4">{t('İhale Başlat')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1">{t('İhale Adı')}</label>
                        <input
                            className="form-input w-full"
                            value={form.ihaleAdi}
                            onChange={(e) => setForm({ ...form, ihaleAdi: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Yem')}</label>
                        <Select
                            options={yemler.map((yem) => ({ value: String(yem.yemID), label: yem.yemAdi }))}
                            value={
                                form.yemID
                                    ? { value: form.yemID, label: yemler.find((y) => String(y.yemID) === form.yemID)?.yemAdi || form.yemID }
                                    : null
                            }
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                            styles={menuStyles}
                            onChange={(selected: SingleValue<OptionType>) => setForm({ ...form, yemID: selected?.value || '' })}
                            placeholder={t('Please Select')}
                            isSearchable={true}
                            isClearable={true}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Talep Miktarı (kg)')}</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            value={form.talepMiktarKg}
                            onChange={(e) => setForm({ ...form, talepMiktarKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Başlangıç')}</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={form.ihaleBaslangicTarihi}
                            onChange={(e) => setForm({ ...form, ihaleBaslangicTarihi: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Bitiş')}</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={form.ihaleBitisTarihi}
                            onChange={(e) => setForm({ ...form, ihaleBitisTarihi: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">{t('Açıklama')}</label>
                        <input
                            className="form-input w-full"
                            value={form.aciklama}
                            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={submitIhale}>
                        {t('İhale Başlat')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IhaleBaslat;

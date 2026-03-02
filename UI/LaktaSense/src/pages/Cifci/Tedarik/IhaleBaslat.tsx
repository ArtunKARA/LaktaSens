import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import Select, { SingleValue, StylesConfig, ActionMeta } from 'react-select';
import Swal from 'sweetalert2';


interface Yem {
    yemID: number;
    yemAdi: string;
}

type OptionType = { value: string; label: string };

const IhaleBaslat = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [yemler, setYemler] = useState<Yem[]>([]);
    const [loadingYem, setLoadingYem] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        ihaleAdi: '',
        ihaleBaslangicTarihi: '',
        ihaleBitisTarihi: '',
        aciklama: '',
        yemID: '',
        talepMiktarKg: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        dispatch(setPageTitle('İhale Başlat'));
    }, [dispatch]);

    // copyFrom desteği
    useEffect(() => {
        const copyFrom = (location.state as any)?.copyFrom;
        if (!copyFrom) return;

        setForm((prev) => ({
            ...prev,
            ihaleAdi: copyFrom.ihaleAdi || '',
            aciklama: copyFrom.aciklama || '',
            yemID: copyFrom.yemID ? String(copyFrom.yemID) : '',
            talepMiktarKg: copyFrom.talepMiktarKg ? String(copyFrom.talepMiktarKg) : '',
        }));
    }, [location.state]);

    const fetchYemler = async () => {
        setLoadingYem(true);
        try {
            const res = await fetch('http://localhost:3030/api/ciftci/ihale/getYemTanimlari');
            const data = await res.json();
            setYemler(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Yemler alınamadı:', err);
            Swal.fire({ icon: 'error', title: 'Yem listesi alınamadı', text: 'Backend bağlantısını kontrol edin.' });
        } finally {
            setLoadingYem(false);
        }
    };

    useEffect(() => {
        fetchYemler();
    }, []);

    // ✅ react-select tip hatalarını bitiren nokta:
    const yemOptions: OptionType[] = useMemo(
        () => yemler.map((y) => ({ value: String(y.yemID), label: y.yemAdi })), // label ASLA undefined değil
        [yemler],
    );

    const selectedYem: OptionType | null = useMemo(
        () => yemOptions.find((o) => o.value === form.yemID) ?? null,
        [yemOptions, form.yemID],
    );

    const menuStyles: StylesConfig<OptionType, false> = {
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 8,
            borderColor: state.isFocused ? 'rgba(59,130,246,0.6)' : base.borderColor,
            boxShadow: state.isFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        }),
        valueContainer: (base) => ({ ...base, padding: '0 10px' }),
    };

    const validate = () => {
        const e: Record<string, string> = {};

        if (!form.ihaleAdi?.trim()) e.ihaleAdi = 'İhale adı zorunlu';
        if (!form.yemID) e.yemID = 'Yem seçimi zorunlu';
        if (!form.talepMiktarKg) e.talepMiktarKg = 'Talep miktarı zorunlu';
        if (Number(form.talepMiktarKg) <= 0) e.talepMiktarKg = 'Talep miktarı 0’dan büyük olmalı';
        if (!form.ihaleBaslangicTarihi) e.ihaleBaslangicTarihi = 'Başlangıç zorunlu';
        if (!form.ihaleBitisTarihi) e.ihaleBitisTarihi = 'Bitiş zorunlu';

        if (form.ihaleBaslangicTarihi && form.ihaleBitisTarihi) {
            const start = new Date(form.ihaleBaslangicTarihi).getTime();
            const end = new Date(form.ihaleBitisTarihi).getTime();
            if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
                e.ihaleBitisTarihi = 'Bitiş, başlangıçtan sonra olmalı';
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const fmtDT = (v: string) => {
        if (!v) return '-';
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return v;
        return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
    };
    const row = (label: string, value: string, highlight?: boolean) => `
    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:10px 12px;
        margin-bottom:10px;
        border-radius:10px;
        background:rgba(0,0,0,.03);
        border:1px solid rgba(0,0,0,.06);
    ">
        <span style="
            font-size:12px;
            color:#6b7280;
            font-weight:600;
        ">
            ${label}
        </span>
        <span style="
            font-size:13px;
            font-weight:700;
            color:${highlight ? "#1d4ed8" : "#111827"};
        ">
            ${value}
        </span>
    </div>
`;

    const miniCard = (label: string, value: string) => `
    <div style="
        padding:12px;
        border-radius:12px;
        border:1px solid rgba(0,0,0,.06);
        background:rgba(0,0,0,.02);
    ">
        <div style="
            font-size:11px;
            color:#6b7280;
            font-weight:600;
            margin-bottom:4px;
        ">
            ${label}
        </div>
        <div style="
            font-size:13px;
            font-weight:700;
            color:#111827;
        ">
            ${value}
        </div>
    </div>
`;


    const submitIhale = async () => {
        if (!form.yemID || !form.talepMiktarKg || !form.ihaleBaslangicTarihi || !form.ihaleBitisTarihi) {
            Swal.fire({
                icon: 'warning',
                title: 'Eksik alanlar var',
                text: 'Lütfen zorunlu alanları doldurun.',
            });
            return;
        }

        const yemLabel =
            yemler.find((y) => String(y.yemID) === form.yemID)?.yemAdi || '-';

        const confirmResult = await Swal.fire({
            title: 'İhaleyi Onaylıyor musunuz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Başlat',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            html: `
            <div style="
                text-align:left;
                margin-top:10px;
            ">

                <div style="
                    border:1px solid rgba(0,0,0,.08);
                    border-radius:14px;
                    padding:16px;
                    box-shadow:0 10px 28px rgba(0,0,0,.10);
                    background:#ffffff;
                ">

                    ${row("İhale Adı", form.ihaleAdi || "-")}
                    ${row("Yem", yemLabel, true)}
                    ${row("Talep", `<b>${form.talepMiktarKg}</b> kg`)}

                    <div style="
                        display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:12px;
                        margin-top:12px;
                    ">
                        ${miniCard("Başlangıç", fmtDT(form.ihaleBaslangicTarihi))}
                        ${miniCard("Bitiş", fmtDT(form.ihaleBitisTarihi))}
                    </div>

                    ${form.aciklama
                    ? `
                        <div style="
                            margin-top:14px;
                            padding:12px;
                            border-radius:12px;
                            background:rgba(0,0,0,.03);
                            border:1px solid rgba(0,0,0,.05);
                        ">
                            <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:4px">
                                Açıklama
                            </div>
                            <div style="font-size:13px;color:#111827">
                                ${form.aciklama}
                            </div>
                        </div>
                    `
                    : ""
                }
                </div>

                <div style="
                    margin-top:14px;
                    font-size:12px;
                    color:#6b7280;
                ">
                    Devam ederseniz ihale yayınlanacaktır.
                </div>
            </div>
        `,
        });

        if (!confirmResult.isConfirmed) return;

        try {
            const payload = {
                acanFirmaID: userInfo?.firmaID,
                ihaleAdi: form.ihaleAdi,
                ihaleBaslangicTarihi: new Date(form.ihaleBaslangicTarihi).toISOString(),
                ihaleBitisTarihi: new Date(form.ihaleBitisTarihi).toISOString(),
                aciklama: form.aciklama,
                yemID: Number(form.yemID),
                talepMiktarKg: Number(form.talepMiktarKg),
                yapanKullaniciID: userInfo?.kullaniciID,
            };

            const res = await fetch(
                'http://localhost:3030/api/ciftci/ihale/postIhaleOlustur',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error();

            await Swal.fire({
                icon: 'success',
                title: 'İhale başarıyla eklendi',
                timer: 1200,
                showConfirmButton: false,
            });

            navigate('/cifci/tedarik/ihalelerim');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'İhale oluşturulamadı.',
            });
        }
    };

    const summary = useMemo(() => {
        const yemLabel = selectedYem?.label || '-';
        const kg = form.talepMiktarKg ? `${form.talepMiktarKg} kg` : '-';
        return {
            yem: yemLabel,
            kg,
            start: form.ihaleBaslangicTarihi || '-',
            end: form.ihaleBitisTarihi || '-',
        };
    }, [selectedYem?.label, form.talepMiktarKg, form.ihaleBaslangicTarihi, form.ihaleBitisTarihi]);
    const FieldBox = ({ children }: { children: React.ReactNode }) => (
        <div className="rounded-xl border border-white-light dark:border-[#1b2e4b] bg-white/50 dark:bg-white/[0.02] p-4">
            {children}
        </div>
    );

    const SectionBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="rounded-2xl border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-black p-5">
            <div className="mb-4 flex items-center justify-between">
                <h6 className="font-semibold">{title}</h6>
            </div>
            {children}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Üst başlık */}
            <div className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h5 className="text-lg font-semibold">İhale Başlat</h5>
                        <p className="text-sm text-white-dark mt-1">
                            Yem seç, talep miktarını gir, tarih aralığını belirle ve ihaleyi yayınla.
                        </p>
                    </div>
                </div>
            </div>

            {/* İçerik: Form + Özet */}
            <div className="grid grid-cols-1 gap-6">
                {/* FORM */}
                <div className="lg:col-span-2">
                    <SectionBox title="İhale Bilgileri">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* İhale Adı */}
                            <div className="md:col-span-2">
                                <FieldBox>
                                    <label className="form-label">
                                        İhale Adı <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        className={`form-input w-full ${errors.ihaleAdi ? 'border-danger' : ''}`}
                                        value={form.ihaleAdi}
                                        onChange={(e) => setForm({ ...form, ihaleAdi: e.target.value })}
                                        placeholder="Örn: Kasım Karma Yem İhalesi"
                                    />
                                    {errors.ihaleAdi && <div className="text-danger text-xs mt-1">{errors.ihaleAdi}</div>}
                                </FieldBox>
                            </div>

                            {/* Yem */}
                            <div>
                                <FieldBox>
                                    <label className="form-label">
                                        Yem <span className="text-danger">*</span>
                                    </label>
                                    <Select<OptionType, false>
                                        options={yemOptions}
                                        value={selectedYem}
                                        isLoading={loadingYem}
                                        isClearable
                                        isSearchable
                                        placeholder={loadingYem ? 'Yükleniyor...' : 'Yem seçiniz'}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        menuPosition="fixed"
                                        styles={menuStyles}
                                        onChange={(selected: SingleValue<OptionType>, _action: ActionMeta<OptionType>) =>
                                            setForm({ ...form, yemID: selected?.value || '' })
                                        }
                                    />
                                    {errors.yemID && <div className="text-danger text-xs mt-1">{errors.yemID}</div>}
                                </FieldBox>
                            </div>

                            {/* Talep */}
                            <div>
                                <FieldBox>
                                    <label className="form-label">
                                        Talep Miktarı (kg) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-input w-full ${errors.talepMiktarKg ? 'border-danger' : ''}`}
                                        value={form.talepMiktarKg}
                                        onChange={(e) => setForm({ ...form, talepMiktarKg: e.target.value })}
                                        placeholder="Örn: 1500"
                                        min={0}
                                    />
                                    {errors.talepMiktarKg && <div className="text-danger text-xs mt-1">{errors.talepMiktarKg}</div>}
                                    <div className="text-xs text-white-dark mt-1">
                                        İpucu: Min/step kuralı backend’de varsa oradan dönen validasyonla da kontrol edebiliriz.
                                    </div>
                                </FieldBox>
                            </div>

                            {/* Başlangıç */}
                            <div>
                                <FieldBox>
                                    <label className="form-label">
                                        Başlangıç <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className={`form-input w-full ${errors.ihaleBaslangicTarihi ? 'border-danger' : ''}`}
                                        value={form.ihaleBaslangicTarihi}
                                        onChange={(e) => setForm({ ...form, ihaleBaslangicTarihi: e.target.value })}
                                    />
                                    {errors.ihaleBaslangicTarihi && (
                                        <div className="text-danger text-xs mt-1">{errors.ihaleBaslangicTarihi}</div>
                                    )}
                                </FieldBox>
                            </div>

                            {/* Bitiş */}
                            <div>
                                <FieldBox>
                                    <label className="form-label">
                                        Bitiş <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className={`form-input w-full ${errors.ihaleBitisTarihi ? 'border-danger' : ''}`}
                                        value={form.ihaleBitisTarihi}
                                        onChange={(e) => setForm({ ...form, ihaleBitisTarihi: e.target.value })}
                                    />
                                    {errors.ihaleBitisTarihi && <div className="text-danger text-xs mt-1">{errors.ihaleBitisTarihi}</div>}
                                </FieldBox>
                            </div>

                            {/* Açıklama */}
                            <div className="md:col-span-2">
                                <FieldBox>
                                    <label className="form-label">Açıklama</label>
                                    <textarea
                                        className="form-textarea w-full min-h-[96px]"
                                        value={form.aciklama}
                                        onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                        placeholder="Teslim koşulları, kalite beklentisi, ek notlar..."
                                    />
                                </FieldBox>
                            </div>
                        </div>

                        {/* Alt aksiyonlar */}
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                className="btn btn-outline-danger"
                                onClick={() => {
                                    setForm({
                                        ihaleAdi: '',
                                        ihaleBaslangicTarihi: '',
                                        ihaleBitisTarihi: '',
                                        aciklama: '',
                                        yemID: '',
                                        talepMiktarKg: '',
                                    });
                                    setErrors({});
                                }}
                                disabled={saving}
                            >
                                Temizle
                            </button>
                            <button className="btn btn-primary" onClick={submitIhale} disabled={saving}>
                                {saving ? 'Kaydediliyor...' : 'İhaleyi Başlat'}
                            </button>
                        </div>
                    </SectionBox>
                </div>


            </div>
        </div>
    );
};

export default IhaleBaslat;
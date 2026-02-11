import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice'; // gerekirse yolunu düzelt
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Select from 'react-select';
import Swal from 'sweetalert2';

type ID = string;
type Category = 'kaba' | 'kesif' | 'karma';
type Status = 'ACTIVE' | 'INACTIVE';

type Lot = {
    id: ID;
    code: string;
    expiry?: string; // ISO
    stockKg: number;
};

type Product = {
    id: ID;
    title: string;
    category: Category;
    pricePerKg: number;
    packaging: { unitKg: number; minOrderKg: number };
    logistics: { kmRate: number; leadDays: number };
    status: Status;
    lots: Lot[];
};

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const sumLots = (lots: Lot[]) => lots.reduce((a, b) => a + (b.stockKg || 0), 0);
const fmtTL = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

const MOCK_PRODUCTS: Product[] = [
    {
        id: uid(),
        title: 'Karma Yem %18 HP (Pelet)',
        category: 'karma',
        pricePerKg: 11.5,
        packaging: { unitKg: 50, minOrderKg: 1000 },
        logistics: { kmRate: 6, leadDays: 2 },
        status: 'ACTIVE',
        lots: [
            { id: uid(), code: 'LOT-2409-A', expiry: '2026-03-01', stockKg: 3200 },
            { id: uid(), code: 'LOT-2409-B', expiry: '2026-03-20', stockKg: 800 },
        ],
    },
    {
        id: uid(),
        title: 'Kaba Yem (Yonca – 1. Sınıf)',
        category: 'kaba',
        pricePerKg: 8.9,
        packaging: { unitKg: 25, minOrderKg: 500 },
        logistics: { kmRate: 5, leadDays: 3 },
        status: 'ACTIVE',
        lots: [{ id: uid(), code: 'LOT-Y-24-08', expiry: '2025-12-31', stockKg: 1500 }],
    },
    {
        id: uid(),
        title: 'Kesif Yem – Enerji Takviyeli',
        category: 'kesif',
        pricePerKg: 12.2,
        packaging: { unitKg: 40, minOrderKg: 800 },
        logistics: { kmRate: 7, leadDays: 1 },
        status: 'INACTIVE',
        lots: [{ id: uid(), code: 'LOT-K-24-10', expiry: '2026-02-15', stockKg: 400 }],
    },
];

const productSchema = Yup.object().shape({
    title: Yup.string().required('Ürün adı zorunlu'),
    category: Yup.mixed<Category>().oneOf(['kaba', 'kesif', 'karma']).required(),
    pricePerKg: Yup.number().positive().required(),
    packaging: Yup.object().shape({
        unitKg: Yup.number().positive().required(),
        minOrderKg: Yup.number().positive().required(),
    }),
    logistics: Yup.object().shape({
        kmRate: Yup.number().positive().required(),
        leadDays: Yup.number().integer().min(0).required(),
    }),
    status: Yup.mixed<Status>().oneOf(['ACTIVE', 'INACTIVE']).required(),
});

const lotSchema = Yup.object().shape({
    code: Yup.string().required('LOT kodu zorunlu'),
    stockKg: Yup.number().positive().required('Stok (kg) zorunlu'),
    expiry: Yup.string().nullable(),
});

const UrunYonetimi = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Ürün Yönetimi'));
    }, [dispatch]);

    // --- State ---
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<'' | Category>('');
    const [st, setSt] = useState<'' | Status>('');

    const [panelOpen, setPanelOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);

    // --- Filters ---
    const filtered = useMemo(() => {
        return products.filter((p) => {
            const byQ = !q || p.title.toLowerCase().includes(q.toLowerCase());
            const byC = !cat || p.category === cat;
            const byS = !st || p.status === st;
            return byQ && byC && byS;
        });
    }, [products, q, cat, st]);

    // --- CRUD: Product ---
    const openNew = () => {
        setEditing({
            id: '',
            title: '',
            category: 'karma',
            pricePerKg: 0,
            packaging: { unitKg: 50, minOrderKg: 1000 },
            logistics: { kmRate: 5, leadDays: 2 },
            status: 'ACTIVE',
            lots: [],
        });
        setPanelOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditing(structuredClone ? structuredClone(p) : JSON.parse(JSON.stringify(p)));
        setPanelOpen(true);
    };

    const saveProduct = (values: Product) => {
        if (!values.id) {
            const toAdd = { ...values, id: uid() };
            setProducts((prev) => [toAdd, ...prev]);
        } else {
            setProducts((prev) => prev.map((x) => (x.id === values.id ? values : x)));
        }
        setPanelOpen(false);
        setEditing(null);
        Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 1200, showConfirmButton: false });
    };

    const removeProduct = async (p: Product) => {
        const res = await Swal.fire({
            title: 'Silinsin mi?',
            text: `${p.title} ürününü silmek üzeresiniz.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'Vazgeç',
        });
        if (res.isConfirmed) {
            setProducts((prev) => prev.filter((x) => x.id !== p.id));
            Swal.fire({ icon: 'success', title: 'Silindi', timer: 1000, showConfirmButton: false });
        }
    };

    const toggleStatus = (p: Product) => {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: x.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : x)));
    };

    // --- LOT Ops ---
    const addLot = (prod: Product, lot: Omit<Lot, 'id'>) => {
        const withId: Lot = { ...lot, id: uid() };
        const updated = { ...prod, lots: [withId, ...(prod.lots || [])] };
        setEditing(updated);
    };

    const updateLot = (prod: Product, lot: Lot) => {
        const updated = { ...prod, lots: prod.lots.map((l) => (l.id === lot.id ? lot : l)) };
        setEditing(updated);
    };

    const deleteLot = (prod: Product, lotId: string) => {
        const updated = { ...prod, lots: prod.lots.filter((l) => l.id !== lotId) };
        setEditing(updated);
    };

    // --- Select Options ---
    const catOptions = [
        { value: 'kaba', label: 'Kaba' },
        { value: 'kesif', label: 'Kesif' },
        { value: 'karma', label: 'Karma' },
    ];
    const stOptions = [
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'INACTIVE', label: 'Pasif' },
    ];

    return (
        <>
            {/* Header & Actions */}
            <div className="panel p-5 mb-6">
                <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-lg">Ürün Yönetimi</h5>
                    <button className="btn btn-primary" onClick={openNew}>
                        Yeni Ürün
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="form-input" placeholder="Ara (ürün adı)..." value={q} onChange={(e) => setQ(e.target.value)} />
                    <Select
                        className="react-select"
                        classNamePrefix="select"
                        placeholder="Kategori"
                        options={catOptions}
                        isClearable
                        value={cat ? catOptions.find((o) => o.value === cat) : null}
                        onChange={(opt: any) => setCat(opt?.value || '')}
                    />
                    <Select
                        className="react-select"
                        classNamePrefix="select"
                        placeholder="Durum"
                        options={stOptions}
                        isClearable
                        value={st ? stOptions.find((o) => o.value === st) : null}
                        onChange={(opt: any) => setSt(opt?.value || '')}
                    />
                    <button className="btn btn-outline-primary" onClick={() => { setQ(''); setCat(''); setSt(''); }}>
                        Filtreleri Sıfırla
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-x-auto">
                <table className="table-hover w-full">
                    <thead>
                        <tr>
                            <th className="!text-left">Ürün</th>
                            <th>Kategori</th>
                            <th>Fiyat</th>
                            <th>Min. Sipariş</th>
                            <th>Toplam Stok</th>
                            <th>Durum</th>
                            <th className="w-48 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td className="!text-left">
                                    <div className="font-medium">{p.title}</div>
                                    <div className="text-xs text-white-dark">Paket: {p.packaging.unitKg} kg • Kargo: {p.logistics.kmRate} TL/km • {p.logistics.leadDays} günde</div>
                                </td>
                                <td className="capitalize">{p.category}</td>
                                <td>{fmtTL(p.pricePerKg)}/kg</td>
                                <td>{p.packaging.minOrderKg} kg</td>
                                <td>{sumLots(p.lots)} kg</td>
                                <td>
                                    <span className={`badge ${p.status === 'ACTIVE' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{p.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</span>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(p)}>
                                            Düzenle
                                        </button>
                                        <button className="btn btn-sm btn-outline-warning" onClick={() => toggleStatus(p)}>
                                            {p.status === 'ACTIVE' ? 'Pasifleştir' : 'Aktifleştir'}
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeProduct(p)}>
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-white-dark">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer / Panel */}
            {panelOpen && editing && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-black shadow-lg overflow-y-auto">
                        <div className="p-5 border-b border-white-light/20 flex items-center justify-between">
                            <h5 className="font-semibold text-lg">{editing.id ? 'Ürün Düzenle' : 'Yeni Ürün'}</h5>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setPanelOpen(false)}>
                                Kapat
                            </button>
                        </div>

                        {/* Product Form */}
                        <div className="p-5">
                            <Formik
                                enableReinitialize
                                initialValues={editing}
                                validationSchema={productSchema}
                                onSubmit={(vals) => saveProduct(vals)}
                            >
                                {({ values, errors, touched, setFieldValue }) => (
                                    <Form className="grid grid-cols-1 gap-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="mb-1">Ürün Adı</label>
                                                <Field name="title" className="form-input" />
                                                {touched.title && errors.title && <div className="text-danger mt-1 text-xs">{String(errors.title)}</div>}
                                            </div>
                                            <div>
                                                <label className="mb-1">Kategori</label>
                                                <Select
                                                    classNamePrefix="select"
                                                    options={[
                                                        { value: 'kaba', label: 'Kaba' },
                                                        { value: 'kesif', label: 'Kesif' },
                                                        { value: 'karma', label: 'Karma' },
                                                    ]}
                                                    value={{ value: values.category, label: values.category }}
                                                    onChange={(opt: any) => setFieldValue('category', opt.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="mb-1">Fiyat (TL/kg)</label>
                                                <Field name="pricePerKg" type="number" step="0.01" className="form-input" />
                                                {touched.pricePerKg && errors.pricePerKg && <div className="text-danger mt-1 text-xs">{String(errors.pricePerKg)}</div>}
                                            </div>
                                            <div>
                                                <label className="mb-1">Paket Birimi (kg)</label>
                                                <Field name="packaging.unitKg" type="number" className="form-input" />
                                            </div>
                                            <div>
                                                <label className="mb-1">Min. Sipariş (kg)</label>
                                                <Field name="packaging.minOrderKg" type="number" className="form-input" />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="mb-1">Navlun (TL/km)</label>
                                                <Field name="logistics.kmRate" type="number" className="form-input" />
                                            </div>
                                            <div>
                                                <label className="mb-1">Teslim Süresi (gün)</label>
                                                <Field name="logistics.leadDays" type="number" className="form-input" />
                                            </div>
                                            <div>
                                                <label className="mb-1">Durum</label>
                                                <Select
                                                    classNamePrefix="select"
                                                    options={[
                                                        { value: 'ACTIVE', label: 'Aktif' },
                                                        { value: 'INACTIVE', label: 'Pasif' },
                                                    ]}
                                                    value={{ value: values.status, label: values.status === 'ACTIVE' ? 'Aktif' : 'Pasif' }}
                                                    onChange={(opt: any) => setFieldValue('status', opt.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* LOT / STOCK TAB */}
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between">
                                                <h6 className="font-semibold">LOT & Stok Yönetimi</h6>
                                                <LotAddButton
                                                    onAdd={(lot) => addLot(values, lot)}
                                                />
                                            </div>

                                            <div className="mt-3 overflow-x-auto">
                                                <table className="table-hover w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="!text-left">LOT Kodu</th>
                                                            <th>Son Kullanım</th>
                                                            <th>Stok (kg)</th>
                                                            <th className="w-40 text-center">İşlemler</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(values.lots || []).map((l: Lot) => (
                                                            <LotRow
                                                                key={l.id}
                                                                lot={l}
                                                                onSave={(lot) => updateLot(values, lot)}
                                                                onDelete={() => deleteLot(values, l.id)}
                                                            />
                                                        ))}
                                                        {(!values.lots || values.lots.length === 0) && (
                                                            <tr>
                                                                <td colSpan={4} className="text-center py-6 text-white-dark">
                                                                    Henüz LOT yok.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <td colSpan={2} className="text-right font-semibold">Toplam</td>
                                                            <td className="font-semibold">{sumLots(values.lots)} kg</td>
                                                            <td />
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 mt-6">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setPanelOpen(false)}>
                                                Vazgeç
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                                Kaydet
                                            </button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/* ------- LOT add button (modal-like inline) ------- */
const LotAddButton = ({ onAdd }: { onAdd: (lot: Omit<Lot, 'id'>) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setOpen(true)}>
                Yeni LOT Ekle
            </button>
            {open && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
                        <h6 className="font-semibold mb-4">LOT Ekle</h6>
                        <Formik
                            initialValues={{ code: '', expiry: '', stockKg: 0 }}
                            validationSchema={lotSchema}
                            onSubmit={(vals) => {
                                onAdd(vals);
                                setOpen(false);
                                Swal.fire({ icon: 'success', title: 'LOT eklendi', timer: 1000, showConfirmButton: false });
                            }}
                        >
                            {({ errors, touched }) => (
                                <Form className="grid gap-4">
                                    <div>
                                        <label>LOT Kodu</label>
                                        <Field name="code" className="form-input" />
                                        {touched.code && errors.code && <div className="text-danger text-xs mt-1">{String(errors.code)}</div>}
                                    </div>
                                    <div>
                                        <label>Son Kullanım (opsiyonel)</label>
                                        <Field name="expiry" type="date" className="form-input" />
                                    </div>
                                    <div>
                                        <label>Stok (kg)</label>
                                        <Field name="stockKg" type="number" className="form-input" />
                                        {touched.stockKg && errors.stockKg && <div className="text-danger text-xs mt-1">{String(errors.stockKg)}</div>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)}>
                                            Kapat
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Ekle
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}
        </>
    );
};

/* ------- LOT row (inline edit) ------- */
const LotRow = ({ lot, onSave, onDelete }: { lot: Lot; onSave: (l: Lot) => void; onDelete: () => void }) => {
    const [edit, setEdit] = useState(false);
    const [local, setLocal] = useState<Lot>(lot);

    useEffect(() => setLocal(lot), [lot]);

    return (
        <tr>
            <td className="!text-left">
                {edit ? (
                    <input className="form-input" value={local.code} onChange={(e) => setLocal({ ...local, code: e.target.value })} />
                ) : (
                    <span className="font-medium">{lot.code}</span>
                )}
            </td>
            <td>
                {edit ? (
                    <input type="date" className="form-input" value={local.expiry || ''} onChange={(e) => setLocal({ ...local, expiry: e.target.value })} />
                ) : (
                    lot.expiry || '-'
                )}
            </td>
            <td>
                {edit ? (
                    <input type="number" className="form-input" value={local.stockKg} onChange={(e) => setLocal({ ...local, stockKg: Number(e.target.value) })} />
                ) : (
                    `${lot.stockKg} kg`
                )}
            </td>
            <td className="text-center">
                {edit ? (
                    <div className="flex items-center justify-center gap-2">
                        <button className="btn btn-xs btn-outline-secondary" onClick={() => { setLocal(lot); setEdit(false); }}>
                            İptal
                        </button>
                        <button
                            className="btn btn-xs btn-primary"
                            onClick={() => {
                                // basit validasyon
                                if (!local.code || local.stockKg <= 0) return;
                                onSave(local);
                                setEdit(false);
                                Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 800, showConfirmButton: false });
                            }}
                        >
                            Kaydet
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <button className="btn btn-xs btn-outline-primary" onClick={() => setEdit(true)}>
                            Düzenle
                        </button>
                        <button
                            className="btn btn-xs btn-outline-danger"
                            onClick={async () => {
                                const res = await Swal.fire({ title: 'LOT silinsin mi?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Evet, sil' });
                                if (res.isConfirmed) onDelete();
                            }}
                        >
                            Sil
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};

export default UrunYonetimi;

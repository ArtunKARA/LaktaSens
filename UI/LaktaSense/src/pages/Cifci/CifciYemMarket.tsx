// UI/LaktaSense/src/pages/Cifci/CifciYemMarket.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import Swal from 'sweetalert2';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

/* ===================== Types ===================== */
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
    description?: string;
    lots: Lot[];
    image?: string;
};

type CartItem = {
    productId: ID;
    title: string;
    unitPrice: number;
    unitKg: number;
    qtyKg: number;
    kmRate: number;
};

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'stock_desc' | 'lead_asc';

/* ===================== Helpers ===================== */
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const sumLots = (lots: Lot[]) => lots.reduce((a, b) => a + (b.stockKg || 0), 0);
const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const clampStep = (value: number, step: number) => Math.max(0, Math.round(value / step) * step);

/* ===================== Mock Cards (Payment) ===================== */
const MOCK_CARDS = [
    { id: 'card-visa', holder: 'TEST KART', number: '4111111111111111', expiry: '12/30', cvv: '123', brand: 'VISA' },
    { id: 'card-mc', holder: 'DENEME KART', number: '5555555555554444', expiry: '11/29', cvv: '321', brand: 'MASTERCARD' },
];

/* ===================== Mock Data ===================== */
const MOCK_PRODUCTS: Product[] = [
    {
        id: uid(),
        title: 'Karma Yem %18 HP (Pelet)',
        category: 'karma',
        pricePerKg: 12,
        packaging: { unitKg: 50, minOrderKg: 1000 },
        logistics: { kmRate: 6, leadDays: 2 },
        status: 'ACTIVE',
        lots: [
            { id: uid(), code: 'LOT-2409-A', expiry: '2026-03-01', stockKg: 3200 },
            { id: uid(), code: 'LOT-2409-B', expiry: '2026-03-20', stockKg: 800 },
        ],
        description: 'Yüksek proteinli pelet yem. Süt verimini destekler.',
        image: 'https://images.unsplash.com/photo-1558020635-555181fa8bdf?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: uid(),
        title: 'Kaba Yem (Yonca – 1. Sınıf)',
        category: 'kaba',
        pricePerKg: 9,
        packaging: { unitKg: 25, minOrderKg: 500 },
        logistics: { kmRate: 5, leadDays: 3 },
        status: 'ACTIVE',
        lots: [{ id: uid(), code: 'LOT-Y-24-08', expiry: '2025-12-31', stockKg: 1500 }],
        description: '1. sınıf kuru yonca balyası. Lifçe zengindir.',
        image: 'https://images.unsplash.com/photo-1503077660907-86d6e85f73c7?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: uid(),
        title: 'Kesif Yem – Enerji Takviyeli',
        category: 'kesif',
        pricePerKg: 13,
        packaging: { unitKg: 40, minOrderKg: 800 },
        logistics: { kmRate: 7, leadDays: 1 },
        status: 'ACTIVE',
        lots: [{ id: uid(), code: 'LOT-K-24-10', expiry: '2026-02-15', stockKg: 600 }],
        description: 'Enerji yoğun rasyonlar için idealdir.',
        image: 'https://images.unsplash.com/photo-1561860319-44d03fdb2ffe?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: uid(),
        title: 'Kaba Yem (Saman)',
        category: 'kaba',
        pricePerKg: 4,
        packaging: { unitKg: 20, minOrderKg: 400 },
        logistics: { kmRate: 4, leadDays: 4 },
        status: 'INACTIVE',
        lots: [{ id: uid(), code: 'LOT-S-24-06', stockKg: 0 }],
        description: 'Standart saman balyası.',
        image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=1200&auto=format&fit=crop',
    },
];

/* ===================== Validation ===================== */
const addToCartSchema = (min: number, step: number, max: number) =>
    Yup.object().shape({
        qtyKg: Yup.number()
            .typeError('Geçerli bir miktar girin')
            .min(min, `En az ${min} kg`)
            .max(max, `En fazla ${max} kg (stok)`)
            .test('step', `Miktar ${step} kg katlarında olmalı`, (v) => (typeof v === 'number' ? v % step === 0 : false))
            .required('Zorunlu'),
    });

/* ===================== Payment Modal ===================== */
function PaymentModal({
    open,
    onClose,
    totals,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    totals: { subtotal: number; freight: number; grand: number } | null;
    onSuccess: (paidBy: { brand: string; masked: string }) => void;
}) {
    const schema = Yup.object().shape({
        holder: Yup.string().required('Kart sahibi gerekli'),
        number: Yup.string().required('Kart numarası gerekli').matches(/^\d{13,19}$/, 'Geçerli bir kart numarası girin'),
        expiry: Yup.string().required('Son kullanma gerekli').matches(/^\d{2}\/\d{2}$/, 'MM/YY formatında'),
        cvv: Yup.string().required('CVV gerekli').matches(/^\d{3,4}$/, '3 veya 4 haneli CVV'),
    });

    const tryPay = (vals: { holder: string; number: string; expiry: string; cvv: string }) => {
        const normalized = vals.number.replace(/\s+/g, '');
        const found = MOCK_CARDS.find(
            (c) =>
                c.number === normalized &&
                c.expiry === vals.expiry &&
                c.cvv === vals.cvv &&
                c.holder.toLowerCase() === vals.holder.trim().toLowerCase(),
        );
        if (found) {
            Swal.fire({ icon: 'success', title: `Ödeme başarılı (${found.brand})`, timer: 1000, showConfirmButton: false });
            onSuccess({ brand: found.brand, masked: `${found.number.slice(0, 4)} **** **** ${found.number.slice(-4)}` });
            return;
        }
        const byNumber = MOCK_CARDS.find((c) => c.number === normalized);
        if (byNumber) {
            Swal.fire({ icon: 'error', title: 'Kart bilgileri hatalı', text: 'CVV veya son kullanım tarihi yanlış olabilir.', timer: 1400, showConfirmButton: false });
            return;
        }
        Swal.fire({ icon: 'error', title: 'Ödeme reddedildi', text: 'Kart kabul edilmedi (mock).', timer: 1400, showConfirmButton: false });
    };

    if (!open || !totals) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg overflow-y-auto">
                <h6 className="font-semibold mb-4">Ödeme Yap (Mock)</h6>

                <div className="mb-3 text-sm">
                    <div>Ara Toplam: <b>{tl(totals.subtotal)}</b></div>
                    <div>Navlun: <b>{tl(totals.freight)}</b></div>
                    <div className="mt-2 font-semibold">Toplam: <b>{tl(totals.grand)}</b></div>
                </div>

                <div className="mb-3 text-xs">
                    <div className="mb-1">Hazır test kartları:</div>
                    <ul className="list-disc pl-5">
                        {MOCK_CARDS.map((c) => (
                            <li key={c.id}>
                                {c.brand} — {c.holder} — <code>{c.number}</code> / {c.expiry} / CVV: {c.cvv}
                            </li>
                        ))}
                    </ul>
                </div>

                <Formik initialValues={{ holder: '', number: '', expiry: '', cvv: '' }} validationSchema={schema} onSubmit={(vals) => tryPay(vals)}>
                    {({ errors, touched }) => (
                        <Form className="grid gap-3">
                            <div>
                                <label>Kart Sahibinin Adı</label>
                                <Field name="holder" className="form-input" />
                                {touched.holder && errors.holder && <div className="text-danger text-xs mt-1">{String(errors.holder)}</div>}
                            </div>
                            <div>
                                <label>Kart Numarası (boşluksuz)</label>
                                <Field name="number" className="form-input" />
                                {touched.number && errors.number && <div className="text-danger text-xs mt-1">{String(errors.number)}</div>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label>Son Kullanma (MM/YY)</label>
                                    <Field name="expiry" className="form-input" placeholder="MM/YY" />
                                    {touched.expiry && errors.expiry && <div className="text-danger text-xs mt-1">{String(errors.expiry)}</div>}
                                </div>
                                <div>
                                    <label>CVV</label>
                                    <Field name="cvv" className="form-input" />
                                    {touched.cvv && errors.cvv && <div className="text-danger text-xs mt-1">{String(errors.cvv)}</div>}
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="btn btn-primary w-full">Öde</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Kapat</button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

/* ===================== Component ===================== */
const CifciYemMarket = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Yem Marketi'));
    }, [dispatch]);

    /* ---- catalog state ---- */
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<'' | Category>('');
    const [sort, setSort] = useState<SortKey>('relevance');
    const [onlyInStock, setOnlyInStock] = useState(true);

    /* ---- detail & cart state ---- */
    const [detail, setDetail] = useState<Product | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [distanceKm, setDistanceKm] = useState<number>(() => Number(localStorage.getItem('market_km') || '0') || 0);
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const raw = localStorage.getItem('market_cart');
            return raw ? (JSON.parse(raw) as CartItem[]) : [];
        } catch {
            return [];
        }
    });

    /* ---- payment state ---- */
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [pendingCheckoutTotals, setPendingCheckoutTotals] = useState<{ subtotal: number; freight: number; grand: number } | null>(null);

    /* persist cart & distance */
    useEffect(() => {
        localStorage.setItem('market_cart', JSON.stringify(cart));
    }, [cart]);
    useEffect(() => {
        localStorage.setItem('market_km', String(distanceKm));
    }, [distanceKm]);

    /* ---- derived ---- */
    const filtered = useMemo(() => {
        let list = products.filter((p) => p.status === 'ACTIVE');
        if (onlyInStock) list = list.filter((p) => sumLots(p.lots) > 0);
        if (cat) list = list.filter((p) => p.category === cat);
        if (q) {
            const s = q.toLowerCase();
            list = list.filter(
                (p) =>
                    p.title.toLowerCase().includes(s) ||
                    p.description?.toLowerCase().includes(s) ||
                    p.lots.some((l) => l.code.toLowerCase().includes(s)),
            );
        }
        switch (sort) {
            case 'price_asc':
                list = [...list].sort((a, b) => a.pricePerKg - b.pricePerKg);
                break;
            case 'price_desc':
                list = [...list].sort((a, b) => b.pricePerKg - a.pricePerKg);
                break;
            case 'stock_desc':
                list = [...list].sort((a, b) => sumLots(b.lots) - sumLots(a.lots));
                break;
            case 'lead_asc':
                list = [...list].sort((a, b) => a.logistics.leadDays - b.logistics.leadDays);
                break;
            default:
                break;
        }
        return list;
    }, [products, q, cat, sort, onlyInStock]);

    const totals = useMemo(() => {
        const totalKg = cart.reduce((a, b) => a + b.qtyKg, 0);
        const subtotal = cart.reduce((a, b) => a + b.qtyKg * b.unitPrice, 0);
        const avgKmRate = cart.length ? cart.reduce((a, b) => a + b.kmRate, 0) / cart.length : 0;
        const freight = Math.max(0, Math.round(distanceKm * avgKmRate));
        const vat = 0;
        const grand = subtotal + freight + vat;
        return { totalKg, subtotal, freight, vat, grand };
    }, [cart, distanceKm]);

    /* ---- catalog actions ---- */
    const openDetail = (p: Product) => setDetail(p);

    const addToCart = (p: Product, qtyKg: number) => {
        const existing = cart.find((c) => c.productId === p.id);
        const step = p.packaging.unitKg;
        const fixedQty = clampStep(qtyKg, step);
        const max = sumLots(p.lots);
        if (fixedQty <= 0 || fixedQty > max) {
            Swal.fire({ icon: 'warning', title: `Miktar uygunsuz`, text: `Stok: ${max} kg, adım: ${step} kg`, timer: 1500, showConfirmButton: false });
            return;
        }
        let next: CartItem[];
        if (existing) {
            const newQty = existing.qtyKg + fixedQty;
            if (newQty > max) {
                Swal.fire({ icon: 'warning', title: 'Stok yetersiz', text: `Maksimum ${max} kg ekleyebilirsiniz.`, timer: 1500, showConfirmButton: false });
                return;
            }
            next = cart.map((c) => (c.productId === p.id ? { ...c, qtyKg: newQty } : c));
        } else {
            next = [
                ...cart,
                {
                    productId: p.id,
                    title: p.title,
                    unitPrice: p.pricePerKg,
                    unitKg: p.packaging.unitKg,
                    qtyKg: fixedQty,
                    kmRate: p.logistics.kmRate,
                },
            ];
        }
        setCart(next);
        setCartOpen(true);
        Swal.fire({ icon: 'success', title: 'Sepete eklendi', timer: 900, showConfirmButton: false });
    };

    const removeFromCart = (id: ID) => setCart((prev) => prev.filter((c) => c.productId !== id));
    const updateCartQty = (id: ID, qtyKg: number) => {
        const prod = products.find((p) => p.id === id);
        if (!prod) return;
        const step = prod.packaging.unitKg;
        const min = prod.packaging.minOrderKg;
        const max = sumLots(prod.lots);
        const fixedQty = clampStep(qtyKg, step);
        if (fixedQty < min || fixedQty > max) return;
        setCart((prev) => prev.map((c) => (c.productId === id ? { ...c, qtyKg: fixedQty } : c)));
    };

    /* ---- checkout: ödeme modalını aç ---- */
    const checkout = () => {
        if (cart.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Sepet boş', timer: 900, showConfirmButton: false });
            return;
        }
        setPendingCheckoutTotals({ subtotal: totals.subtotal, freight: totals.freight, grand: totals.grand });
        setPaymentOpen(true);
    };

    /* ---- ödeme başarı: stok düş + sepeti temizle ---- */
    const onPaymentSuccess = (cardInfo: { brand: string; masked: string }) => {
        const orderId = 'MKT-' + Math.floor(100000 + Math.random() * 900000);

        // stok düş
        const nextProducts = products.map((p) => {
            const inCart = cart.find((c) => c.productId === p.id);
            if (!inCart) return p;
            let remain = inCart.qtyKg;
            const lots = p.lots.map((l) => {
                if (remain <= 0) return l;
                const take = Math.min(remain, l.stockKg);
                remain -= take;
                return { ...l, stockKg: l.stockKg - take };
            });
            return { ...p, lots };
        });
        setProducts(nextProducts);

        // ödeme kaydını (mock) sakla
        const payRaw = localStorage.getItem('mock_payments') || '[]';
        const pays = JSON.parse(payRaw) as any[];
        const paidAmount = pendingCheckoutTotals?.grand ?? 0;
        pays.push({
            id: 'PAY-' + Date.now(),
            orderId,
            amount: paidAmount,
            card: cardInfo,
            date: new Date().toISOString(),
        });
        localStorage.setItem('mock_payments', JSON.stringify(pays));

        // UI temizlik
        setCart([]);
        setCartOpen(false);
        setPaymentOpen(false);
        setPendingCheckoutTotals(null);

        Swal.fire({
            icon: 'success',
            title: `Ödeme başarılı. Sipariş #${orderId}`,
            text: `Ödendi: ${tl(paidAmount)} — ${cardInfo.brand} ${cardInfo.masked}`,
            timer: 1600,
            showConfirmButton: false,
        });
    };

    /* ===================== UI ===================== */
    const ProductCard = ({ p }: { p: Product }) => {
        const stock = sumLots(p.lots);
        return (
            <div className="panel p-0 overflow-hidden">
                {p.image && <img src={p.image} alt={p.title} className="w-full h-40 object-cover" />}
                <div className="p-4">
                    <div className="flex items-start justify-between">
                        <h6 className="font-semibold leading-snug">{p.title}</h6>
                        <span className="badge badge-outline-primary capitalize">{p.category}</span>
                    </div>
                    <div className="mt-1 text-sm text-white-dark">
                        Paket: {p.packaging.unitKg} kg • Min: {p.packaging.minOrderKg} kg • Teslim: {p.logistics.leadDays} gün
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-lg font-semibold">{tl(p.pricePerKg)}/kg</div>
                        <div className={`text-xs ${stock > 0 ? 'text-success' : 'text-danger'}`}>Stok: {stock} kg</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button className="btn btn-outline-primary flex-1" onClick={() => openDetail(p)}>
                            Detay
                        </button>
                        <button
                            className="btn btn-primary flex-1 disabled:opacity-50"
                            disabled={stock <= 0}
                            onClick={() => {
                                const min = p.packaging.minOrderKg;
                                addToCart(p, min);
                            }}
                        >
                            Sepete Ekle
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Header & Filters */}
            <div className="panel p-5 mb-6">
                <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-lg">Yem Marketi</h5>
                    <button className="btn btn-primary" onClick={() => setCartOpen(true)}>
                        Sepet ({cart.length})
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input className="form-input" placeholder="Ara (ürün, lot kodu...)" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="form-select" value={cat} onChange={(e) => setCat(e.target.value as any)}>
                        <option value="">Kategori (Tümü)</option>
                        <option value="kaba">Kaba</option>
                        <option value="kesif">Kesif</option>
                        <option value="karma">Karma</option>
                    </select>
                    <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                        <option value="relevance">Sıralama: Önerilen</option>
                        <option value="price_asc">Fiyat (Artan)</option>
                        <option value="price_desc">Fiyat (Azalan)</option>
                        <option value="stock_desc">Stok (Yüksek → Düşük)</option>
                        <option value="lead_asc">Teslim Süresi (Kısa → Uzun)</option>
                    </select>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="form-checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                        Sadece stoktakiler
                    </label>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => {
                            setQ('');
                            setCat('');
                            setSort('relevance');
                            setOnlyInStock(true);
                        }}
                    >
                        Filtreleri Sıfırla
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                    <ProductCard key={p.id} p={p} />
                ))}
            </div>
            {filtered.length === 0 && <div className="panel p-6 mt-4 text-center text-white-dark">Uygun ürün bulunamadı.</div>}

            {/* ============== Detail Drawer ============== */}
            {detail && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-black shadow-lg overflow-y-auto">
                        <div className="p-5 border-b border-white-light/20 flex items-center justify-between">
                            <h5 className="font-semibold text-lg">{detail.title}</h5>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDetail(null)}>
                                Kapat
                            </button>
                        </div>

                        <div className="p-5 grid md:grid-cols-2 gap-5">
                            <div>
                                {detail.image && <img src={detail.image} alt={detail.title} className="w-full rounded-lg object-cover" />}
                                <div className="mt-4">
                                    <h6 className="font-semibold mb-2">LOT & Stok</h6>
                                    <div className="overflow-x-auto">
                                        <table className="table-hover w-full">
                                            <thead>
                                                <tr>
                                                    <th className="!text-left">LOT</th>
                                                    <th>SKT</th>
                                                    <th>Stok (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.lots.map((l) => (
                                                    <tr key={l.id}>
                                                        <td className="!text-left">{l.code}</td>
                                                        <td>{l.expiry || '-'}</td>
                                                        <td>{l.stockKg}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={2} className="text-right font-semibold">Toplam</td>
                                                    <td className="font-semibold">{sumLots(detail.lots)} kg</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-white-dark capitalize">Kategori: {detail.category}</div>
                                <div className="mt-1">Fiyat: <b>{tl(detail.pricePerKg)}/kg</b></div>
                                <div className="text-sm text-white-dark mt-1">Paket: {detail.packaging.unitKg} kg • Min sipariş: {detail.packaging.minOrderKg} kg</div>
                                <div className="text-sm text-white-dark mt-1">Teslim: {detail.logistics.leadDays} gün • Km ücreti: {tl(detail.logistics.kmRate)}/km</div>
                                <p className="mt-3 text-sm">{detail.description || 'Açıklama bulunmuyor.'}</p>

                                {/* Add to cart form */}
                                <div className="mt-4 border-t border-white-light/20 pt-4">
                                    <Formik
                                        initialValues={{ qtyKg: detail.packaging.minOrderKg }}
                                        validationSchema={addToCartSchema(detail.packaging.minOrderKg, detail.packaging.unitKg, sumLots(detail.lots))}
                                        onSubmit={(vals) => {
                                            addToCart(detail, vals.qtyKg);
                                        }}
                                    >
                                        {({ values, errors, touched, setFieldValue }) => (
                                            <Form className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="md:col-span-2">
                                                    <label>Miktar (kg)</label>
                                                    <Field name="qtyKg" type="number" className="form-input" />
                                                    {touched.qtyKg && errors.qtyKg && <div className="text-danger text-xs mt-1">{String(errors.qtyKg)}</div>}
                                                    <div className="mt-2 flex gap-2">
                                                        {[1, 2, 3].map((m) => (
                                                            <button
                                                                key={m}
                                                                type="button"
                                                                className="btn btn-xs btn-outline-secondary"
                                                                onClick={() => setFieldValue('qtyKg', clampStep(values.qtyKg + m * detail.packaging.unitKg, detail.packaging.unitKg))}
                                                            >
                                                                +{m * detail.packaging.unitKg}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-outline-secondary"
                                                            onClick={() => setFieldValue('qtyKg', detail.packaging.minOrderKg)}
                                                        >
                                                            Min
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <button type="submit" className="btn btn-primary w-full">Sepete Ekle</button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============== Cart Drawer ============== */}
            {cartOpen && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-black shadow-lg overflow-y-auto">
                        <div className="p-5 border-b border-white-light/20 flex items-center justify-between">
                            <h5 className="font-semibold text-lg">Sepet</h5>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setCartOpen(false)}>Kapat</button>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div className="md:col-span-2">
                                    <label>Mesafe (km)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={distanceKm}
                                        onChange={(e) => setDistanceKm(Math.max(0, Number(e.target.value)))}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button className="btn btn-outline-secondary w-full" onClick={() => setDistanceKm(0)}>Sıfırla</button>
                                </div>
                            </div>

                            {cart.length === 0 && <div className="text-white-dark text-center py-10">Sepet boş.</div>}

                            {cart.map((c) => {
                                const p = products.find((x) => x.id === c.productId);

                                // Ürün katalogdan kaldırılmış veya bulunamıyor -> güvenli fallback
                                if (!p) {
                                    return (
                                        <div key={c.productId} className="border border-white-light dark:border-[#1b2e4b] rounded-md p-3 mb-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-semibold">{c.title}</div>
                                                    <div className="text-xs text-danger">Bu ürün artık katalogda bulunmuyor.</div>
                                                </div>
                                                <button className="btn btn-xs btn-outline-danger" onClick={() => removeFromCart(c.productId)}>Kaldır</button>
                                            </div>
                                        </div>
                                    );
                                }

                                const max = sumLots(p.lots || []);
                                return (
                                    <div key={c.productId} className="border border-white-light dark:border-[#1b2e4b] rounded-md p-3 mb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{c.title}</div>
                                                <div className="text-xs text-white-dark">
                                                    Birim: {c.unitKg} kg • Fiyat: {tl(c.unitPrice)}/kg • Km ücreti: {tl(c.kmRate)}/km
                                                </div>
                                            </div>
                                            <button className="btn btn-xs btn-outline-danger" onClick={() => removeFromCart(c.productId)}>Kaldır</button>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label>Miktar (kg)</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={c.qtyKg}
                                                    onChange={(e) => {
                                                        const v = Number(e.target.value);
                                                        if (Number.isNaN(v)) return;
                                                        updateCartQty(c.productId, v);
                                                    }}
                                                />
                                                <div className="text-xs text-white-dark mt-1">
                                                    Min {p.packaging.minOrderKg} • Adım {p.packaging.unitKg} • Stok {max}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 flex items-end justify-end">
                                                <div className="text-right">
                                                    <div className="text-sm text-white-dark">Ara toplam</div>
                                                    <div className="text-lg font-semibold">{tl(c.qtyKg * c.unitPrice)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}


                            {/* Summary */}
                            {cart.length > 0 && (
                                <div className="panel p-4 mt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Toplam Kg</span>
                                        <span>{totals.totalKg} kg</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span>Ara Toplam</span>
                                        <span>{tl(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span>Navlun</span>
                                        <span>{tl(totals.freight)}</span>
                                    </div>
                                    <div className="flex items-center justify-between font-semibold text-base mt-2 border-t border-white-light/20 pt-2">
                                        <span>Genel Toplam</span>
                                        <span>{tl(totals.grand)}</span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <button className="btn btn-outline-secondary" onClick={() => setCart([])}>Sepeti Temizle</button>
                                        <button className="btn btn-primary" onClick={checkout}>Siparişi Tamamla</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============== Payment Modal ============== */}
            {paymentOpen && (
                <PaymentModal
                    open={paymentOpen}
                    onClose={() => { setPaymentOpen(false); setPendingCheckoutTotals(null); }}
                    totals={pendingCheckoutTotals}
                    onSuccess={onPaymentSuccess}
                />
            )}
        </>
    );
};

export default CifciYemMarket;

import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';

/* ==== Types ==== */
type ID = string;

type ShipStatus = 'CREATED' | 'IN_TRANSIT' | 'DELIVERED';
type ReturnStatus =
    | 'RETURN_REQUESTED'
    | 'RETURN_APPROVED'
    | 'RETURN_REJECTED'
    | 'RETURN_PICKED'
    | 'RETURN_COMPLETED';

type StatusUnion = ShipStatus | ReturnStatus;
type TabStatus = 'ALL' | StatusUnion;

type ShipmentEvent = { at: string; note: string };

type Shipment = {
    id: ID;
    orderId: ID;
    farmerName: string;
    address: { city: string; district: string };
    tracking: { carrier: string; number: string };
    itemsKg: number; // toplam kg
    status: StatusUnion;
    createdAt: string; // ISO
    events: ShipmentEvent[];
    // Return info (varsa)
    returnInfo?: {
        reason?: string;
        qtyKg?: number;
    };
};

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const tl = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

/* ==== Mock Data ==== */
const MOCK: Shipment[] = [
    {
        id: uid(),
        orderId: 'ORD-10231',
        farmerName: 'Akçay Çiftliği',
        address: { city: 'Balıkesir', district: 'Edremit' },
        tracking: { carrier: 'LaktaKargo', number: 'LK-452931' },
        itemsKg: 2000,
        status: 'IN_TRANSIT',
        createdAt: '2025-11-06T09:30:00Z',
        events: [{ at: '2025-11-06T08:30:00Z', note: 'Araç yüklendi' }],
    },
    {
        id: uid(),
        orderId: 'ORD-10212',
        farmerName: 'Doğa Süt',
        address: { city: 'Bursa', district: 'Karacabey' },
        tracking: { carrier: 'Yolda', number: 'YD-993120' },
        itemsKg: 800,
        status: 'DELIVERED',
        createdAt: '2025-11-03T12:00:00Z',
        events: [{ at: '2025-11-04T15:40:00Z', note: 'Teslim edildi' }],
    },
    {
        id: uid(),
        orderId: 'ORD-10245',
        farmerName: 'Gölbaşı Tarım',
        address: { city: 'Ankara', district: 'Gölbaşı' },
        tracking: { carrier: 'MNG', number: 'MNG-88120' },
        itemsKg: 1500,
        status: 'RETURN_REQUESTED',
        createdAt: '2025-11-05T10:00:00Z',
        events: [{ at: '2025-11-07T11:10:00Z', note: 'İade talebi oluşturuldu (rutubet şüphesi, 200 kg)' }],
        returnInfo: { reason: 'Rutubet şüphesi', qtyKg: 200 },
    },
    {
        id: uid(),
        orderId: 'ORD-10301',
        farmerName: 'Kuzey Çiftliği',
        address: { city: 'Samsun', district: 'Atakum' },
        tracking: { carrier: 'Sürat', number: 'SR-881201' },
        itemsKg: 600,
        status: 'RETURN_APPROVED',
        createdAt: '2025-11-02T09:00:00Z',
        events: [{ at: '2025-11-03T11:00:00Z', note: 'İade onaylandı (150 kg)' }],
        returnInfo: { reason: 'Yanlış ürün', qtyKg: 150 },
    },
];

/* ==== Validation Schemas ==== */
const trackSchema = Yup.object().shape({
    carrier: Yup.string().required('Taşıyıcı zorunlu'),
    number: Yup.string().required('Takip no zorunlu'),
});

const approveReturnSchema = Yup.object().shape({
    qtyKg: Yup.number().positive('Pozitif olmalı').required('Miktar zorunlu'),
    note: Yup.string().max(255, 'En fazla 255 karakter'),
});

const pickupSchema = Yup.object().shape({
    pickupNote: Yup.string().max(255, 'En fazla 255 karakter'),
});

const completeSchema = Yup.object().shape({
    warehouseNote: Yup.string().max(255, 'En fazla 255 karakter'),
});

/* ==== Component ==== */
const TedarikciSevkiyatIade = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sevkiyat & İade Yönetimi'));
    }, [dispatch]);

    /* state */
    const [rows, setRows] = useState<Shipment[]>(MOCK);
    const [tab, setTab] = useState<TabStatus>('ALL');
    const [q, setQ] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    /* modal state */
    const [editTrackFor, setEditTrackFor] = useState<Shipment | null>(null);
    const [approveReturnFor, setApproveReturnFor] = useState<Shipment | null>(null);
    const [pickupFor, setPickupFor] = useState<Shipment | null>(null);
    const [completeFor, setCompleteFor] = useState<Shipment | null>(null);

    /* counts for badges */
    const counts = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.ALL++;
                acc[r.status]++;
                return acc;
            },
            {
                ALL: 0,
                CREATED: 0,
                IN_TRANSIT: 0,
                DELIVERED: 0,
                RETURN_REQUESTED: 0,
                RETURN_APPROVED: 0,
                RETURN_REJECTED: 0,
                RETURN_PICKED: 0,
                RETURN_COMPLETED: 0,
            } as Record<TabStatus | StatusUnion, number>,
        );
    }, [rows]);

    /* filter */
    const filtered = useMemo(() => {
        let list = tab === 'ALL' ? rows : rows.filter((r) => r.status === tab);
        if (q) {
            const s = q.toLowerCase();
            list = list.filter(
                (r) =>
                    r.orderId.toLowerCase().includes(s) ||
                    r.farmerName.toLowerCase().includes(s) ||
                    r.address.city.toLowerCase().includes(s) ||
                    r.address.district.toLowerCase().includes(s) ||
                    r.tracking.number.toLowerCase().includes(s),
            );
        }
        if (dateFrom) list = list.filter((r) => r.createdAt.slice(0, 10) >= dateFrom);
        if (dateTo) list = list.filter((r) => r.createdAt.slice(0, 10) <= dateTo);
        return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, [rows, tab, q, dateFrom, dateTo]);

    /* helpers */
    const addEvent = (r: Shipment, note: string) => ({
        ...r,
        events: [{ at: new Date().toISOString(), note }, ...r.events],
    });

    /* actions: shipment */
    const markInTransit = (r: Shipment) => {
        setRows((prev) => prev.map((x) => (x.id === r.id ? addEvent({ ...x, status: 'IN_TRANSIT' }, 'Yola çıktı') : x)));
    };
    const markDelivered = (r: Shipment) => {
        setRows((prev) => prev.map((x) => (x.id === r.id ? addEvent({ ...x, status: 'DELIVERED' }, 'Teslim edildi') : x)));
    };

    /* actions: returns */
    const openApproveReturn = (r: Shipment) => setApproveReturnFor(r);
    const openPickup = (r: Shipment) => setPickupFor(r);
    const openComplete = (r: Shipment) => setCompleteFor(r);

    const rejectReturn = async (r: Shipment) => {
        const res = await Swal.fire({
            title: 'Red sebebi',
            input: 'text',
            inputPlaceholder: 'Açıklama',
            showCancelButton: true,
            confirmButtonText: 'Reddet',
            cancelButtonText: 'Vazgeç',
        });
        if (res.isConfirmed) {
            setRows((prev) =>
                prev.map((x) =>
                    x.id === r.id ? addEvent({ ...x, status: 'RETURN_REJECTED' }, `İade reddedildi: ${res.value || '-'}`) : x,
                ),
            );
            Swal.fire({ icon: 'success', title: 'İade reddedildi', timer: 900, showConfirmButton: false });
        }
    };

    /* view components */
    const TabButton = ({ s, label }: { s: TabStatus; label: string }) => (
        <button
            className={`px-3 py-2 rounded-md text-sm border ${tab === s ? 'bg-primary text-white border-primary' : 'border-white-dark dark:border-[#1b2e4b]'
                }`}
            onClick={() => setTab(s)}
        >
            {label}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">{counts[s]}</span>
        </button>
    );

    return (
        <>
            {/* Header / filters */}
            <div className="panel p-5 mb-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-lg">Sevkiyat & İade Yönetimi</h5>
                    <div className="flex flex-wrap gap-2">
                        <TabButton s="ALL" label="Tümü" />
                        <TabButton s="CREATED" label="Oluşturuldu" />
                        <TabButton s="IN_TRANSIT" label="Yolda" />
                        <TabButton s="DELIVERED" label="Teslim" />
                        <TabButton s="RETURN_REQUESTED" label="İade Talebi" />
                        <TabButton s="RETURN_APPROVED" label="İade Onaylı" />
                        <TabButton s="RETURN_PICKED" label="İade Alındı" />
                        <TabButton s="RETURN_COMPLETED" label="İade Tamamlandı" />
                        <TabButton s="RETURN_REJECTED" label="İade Reddedildi" />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="form-input" placeholder="Ara (sipariş/çiftçi/şehir/takip no)..." value={q} onChange={(e) => setQ(e.target.value)} />
                    <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button className="btn btn-outline-primary" onClick={() => { setQ(''); setDateFrom(''); setDateTo(''); }}>
                        Filtreleri Sıfırla
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filtered.map((r) => (
                    <div key={r.id} className="panel p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-semibold text-base">{r.farmerName} <span className="text-xs text-white-dark ml-2">#{r.orderId}</span></div>
                                <div className="text-xs text-white-dark">
                                    {r.address.city}, {r.address.district} • {new Date(r.createdAt).toLocaleString('tr-TR')}
                                </div>
                                <div className="mt-1 text-sm">
                                    <span className="font-medium">Kargo:</span> {r.tracking.carrier} — <span className="font-medium">Takip:</span> {r.tracking.number} •
                                    <span className="ml-2"> Toplam: {r.itemsKg} kg</span>
                                    {r.returnInfo?.qtyKg ? <span className="ml-2"> | İade: {r.returnInfo.qtyKg} kg</span> : null}
                                </div>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`badge ${['CREATED', 'IN_TRANSIT'].includes(r.status)
                                        ? 'badge-outline-primary'
                                        : r.status === 'DELIVERED'
                                            ? 'badge-outline-success'
                                            : r.status === 'RETURN_REJECTED'
                                                ? 'badge-outline-danger'
                                                : 'badge-outline-warning'
                                        }`}
                                >
                                    {r.status}
                                </span>
                                <div className="mt-2">
                                    <button className="btn btn-xs btn-outline-secondary" onClick={() => setEditTrackFor(r)}>
                                        Takip / Taşıyıcı Düzenle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* timeline */}
                        <ul className="mt-3 text-xs list-disc pl-4">
                            {r.events.map((e, i) => (
                                <li key={i}>{new Date(e.at).toLocaleString('tr-TR')} — {e.note}</li>
                            ))}
                        </ul>

                        {/* actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {/* shipment side */}
                            {r.status === 'CREATED' && (
                                <button className="btn btn-sm btn-primary" onClick={() => markInTransit(r)}>Yola Çıkar</button>
                            )}
                            {r.status === 'IN_TRANSIT' && (
                                <button className="btn btn-sm btn-primary" onClick={() => markDelivered(r)}>Teslim Et</button>
                            )}

                            {/* returns side */}
                            {r.status === 'RETURN_REQUESTED' && (
                                <>
                                    <button className="btn btn-sm btn-primary" onClick={() => openApproveReturn(r)}>İadeyi Onayla</button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => rejectReturn(r)}>Reddet</button>
                                </>
                            )}
                            {r.status === 'RETURN_APPROVED' && (
                                <button className="btn btn-sm btn-primary" onClick={() => openPickup(r)}>İade Teslim Al</button>
                            )}
                            {r.status === 'RETURN_PICKED' && (
                                <button className="btn btn-sm btn-primary" onClick={() => openComplete(r)}>Depoya Giriş / Tamamla</button>
                            )}
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && <div className="panel p-6 text-center text-white-dark">Kayıt bulunamadı.</div>}
            </div>

            {/* ===== Modals ===== */}

            {/* Edit tracking */}
            {editTrackFor && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setEditTrackFor(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
                        <h6 className="font-semibold mb-4">Takip / Taşıyıcı Düzenle</h6>
                        <Formik
                            enableReinitialize
                            initialValues={{ carrier: editTrackFor.tracking.carrier, number: editTrackFor.tracking.number }}
                            validationSchema={trackSchema}
                            onSubmit={(vals) => {
                                setRows((prev) =>
                                    prev.map((x) =>
                                        x.id === editTrackFor.id
                                            ? addEvent(
                                                { ...x, tracking: { carrier: vals.carrier, number: vals.number } },
                                                `Takip güncellendi (${vals.carrier} / ${vals.number})`,
                                            )
                                            : x,
                                    ),
                                );
                                Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 900, showConfirmButton: false });
                                setEditTrackFor(null);
                            }}
                        >
                            {({ errors, touched }) => (
                                <Form className="grid gap-4">
                                    <div>
                                        <label>Taşıyıcı</label>
                                        <Field name="carrier" className="form-input" />
                                        {touched.carrier && errors.carrier && <div className="text-danger text-xs mt-1">{String(errors.carrier)}</div>}
                                    </div>
                                    <div>
                                        <label>Takip No</label>
                                        <Field name="number" className="form-input" />
                                        {touched.number && errors.number && <div className="text-danger text-xs mt-1">{String(errors.number)}</div>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setEditTrackFor(null)}>Kapat</button>
                                        <button type="submit" className="btn btn-primary">Kaydet</button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}

            {/* Approve return */}
            {approveReturnFor && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setApproveReturnFor(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
                        <h6 className="font-semibold mb-4">İade Onayı</h6>
                        <Formik
                            enableReinitialize
                            initialValues={{
                                qtyKg: approveReturnFor.returnInfo?.qtyKg || 0,
                                note: approveReturnFor.returnInfo?.reason || '',
                            }}
                            validationSchema={approveReturnSchema}
                            onSubmit={(vals) => {
                                setRows((prev) =>
                                    prev.map((x) =>
                                        x.id === approveReturnFor.id
                                            ? addEvent(
                                                {
                                                    ...x,
                                                    status: 'RETURN_APPROVED',
                                                    returnInfo: { qtyKg: vals.qtyKg, reason: vals.note },
                                                },
                                                `İade onaylandı (${vals.qtyKg} kg)`,
                                            )
                                            : x,
                                    ),
                                );
                                Swal.fire({ icon: 'success', title: 'İade onaylandı', timer: 900, showConfirmButton: false });
                                setApproveReturnFor(null);
                            }}
                        >
                            {({ errors, touched }) => (
                                <Form className="grid gap-4">
                                    <div>
                                        <label>İade Miktarı (kg)</label>
                                        <Field name="qtyKg" type="number" className="form-input" />
                                        {touched.qtyKg && errors.qtyKg && <div className="text-danger text-xs mt-1">{String(errors.qtyKg)}</div>}
                                    </div>
                                    <div>
                                        <label>Not (opsiyonel)</label>
                                        <Field name="note" className="form-input" />
                                        {touched.note && errors.note && <div className="text-danger text-xs mt-1">{String(errors.note)}</div>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setApproveReturnFor(null)}>Kapat</button>
                                        <button type="submit" className="btn btn-primary">Onayla</button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}

            {/* Pickup return */}
            {pickupFor && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setPickupFor(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
                        <h6 className="font-semibold mb-4">İade Teslim Alma</h6>
                        <Formik
                            initialValues={{ pickupNote: '' }}
                            validationSchema={pickupSchema}
                            onSubmit={(vals) => {
                                setRows((prev) =>
                                    prev.map((x) =>
                                        x.id === pickupFor.id ? addEvent({ ...x, status: 'RETURN_PICKED' }, `İade teslim alındı. ${vals.pickupNote || ''}`) : x,
                                    ),
                                );
                                Swal.fire({ icon: 'success', title: 'İade teslim alındı', timer: 900, showConfirmButton: false });
                                setPickupFor(null);
                            }}
                        >
                            {({ errors, touched }) => (
                                <Form className="grid gap-4">
                                    <div>
                                        <label>Not (opsiyonel)</label>
                                        <Field name="pickupNote" className="form-input" />
                                        {touched.pickupNote && errors.pickupNote && <div className="text-danger text-xs mt-1">{String(errors.pickupNote)}</div>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setPickupFor(null)}>Kapat</button>
                                        <button type="submit" className="btn btn-primary">Kaydet</button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            )}

            {/* Complete return */}
            {completeFor && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setCompleteFor(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
                        <h6 className="font-semibold mb-4">Depoya Giriş / İade Tamamlama</h6>
                        <Formik
                            initialValues={{ warehouseNote: '' }}
                            validationSchema={completeSchema}
                            onSubmit={(vals) => {
                                setRows((prev) =>
                                    prev.map((x) =>
                                        x.id === completeFor.id
                                            ? addEvent({ ...x, status: 'RETURN_COMPLETED' }, `Depoya giriş yapıldı. ${vals.warehouseNote || ''}`)
                                            : x,
                                    ),
                                );
                                Swal.fire({ icon: 'success', title: 'İade tamamlandı', timer: 900, showConfirmButton: false });
                                setCompleteFor(null);
                            }}
                        >
                            {({ errors, touched }) => (
                                <Form className="grid gap-4">
                                    <div>
                                        <label>Depo Notu (opsiyonel)</label>
                                        <Field name="warehouseNote" className="form-input" />
                                        {touched.warehouseNote && errors.warehouseNote && <div className="text-danger text-xs mt-1">{String(errors.warehouseNote)}</div>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setCompleteFor(null)}>Kapat</button>
                                        <button type="submit" className="btn btn-primary">Tamamla</button>
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

export default TedarikciSevkiyatIade;

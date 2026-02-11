import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice'; // gerekirse yolu düzelt
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

type ID = string;
type OrderStatus = 'PENDING_APPROVAL' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
type TabStatus = 'ALL' | OrderStatus; // 👈 Tümü için

type OrderItem = { name: string; qtyKg: number; unitPrice: number };
type ShipmentEvent = { at: string; note: string };
type Shipment = {
  carrier: string;
  trackingNumber: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED';
  events: ShipmentEvent[];
};

type MarketOrder = {
  id: ID;
  farmerName: string;
  supplierName: string;
  address: { city: string; district: string };
  deliveryWindow: { start: string; end: string }; // ISO
  items: OrderItem[];
  totals: { subtotal: number; freight: number; vat: number; grand: number };
  status: OrderStatus;
  createdAt: string; // ISO
  shipment?: Shipment;
  source: 'MARKET';
};

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const tl = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const kg = (n: number) => `${n} kg`;
const sumKg = (items: OrderItem[]) => items.reduce((a, b) => a + b.qtyKg, 0);

const MOCK_ORDERS: MarketOrder[] = [
  {
    id: uid(),
    farmerName: 'Akçay Çiftliği',
    supplierName: 'Anadolu Yem',
    address: { city: 'Balıkesir', district: 'Edremit' },
    deliveryWindow: { start: '2025-11-10', end: '2025-11-12' },
    items: [{ name: 'Karma Yem %18 HP', qtyKg: 2000, unitPrice: 11.5 }],
    totals: { subtotal: 23000, freight: 4200, vat: 0, grand: 27200 },
    status: 'PENDING_APPROVAL',
    createdAt: '2025-11-06T10:12:00Z',
    source: 'MARKET',
  },
  {
    id: uid(),
    farmerName: 'Yıldızlar Süt',
    supplierName: 'Marmara Yem',
    address: { city: 'Kocaeli', district: 'Başiskele' },
    deliveryWindow: { start: '2025-11-09', end: '2025-11-10' },
    items: [{ name: 'Kesif Yem Enerji', qtyKg: 1200, unitPrice: 12.2 }],
    totals: { subtotal: 14640, freight: 3600, vat: 0, grand: 18240 },
    status: 'PREPARING',
    createdAt: '2025-11-05T09:00:00Z',
    shipment: undefined,
    source: 'MARKET',
  },
  {
    id: uid(),
    farmerName: 'Gölbaşı Tarım',
    supplierName: 'Anadolu Yem',
    address: { city: 'Ankara', district: 'Gölbaşı' },
    deliveryWindow: { start: '2025-11-08', end: '2025-11-11' },
    items: [{ name: 'Yonca (1. sınıf)', qtyKg: 1500, unitPrice: 8.9 }],
    totals: { subtotal: 13350, freight: 2900, vat: 0, grand: 16250 },
    status: 'SHIPPED',
    shipment: {
      carrier: 'LaktaKargo',
      trackingNumber: 'LK-452931',
      status: 'IN_TRANSIT',
      events: [{ at: new Date().toISOString(), note: 'Araç yüklendi' }],
    },
    createdAt: '2025-11-04T12:30:00Z',
    source: 'MARKET',
  },
  {
    id: uid(),
    farmerName: 'Doğa Süt',
    supplierName: 'Marmara Yem',
    address: { city: 'Bursa', district: 'Karacabey' },
    deliveryWindow: { start: '2025-11-06', end: '2025-11-07' },
    items: [{ name: 'Karma Yem %18 HP', qtyKg: 800, unitPrice: 11.5 }],
    totals: { subtotal: 9200, freight: 1400, vat: 0, grand: 10600 },
    status: 'DELIVERED',
    shipment: {
      carrier: 'Yolda',
      trackingNumber: 'YD-993120',
      status: 'DELIVERED',
      events: [{ at: '2025-11-06T15:40:00Z', note: 'Teslim edildi' }],
    },
    createdAt: '2025-11-03T16:00:00Z',
    source: 'MARKET',
  },
  {
    id: uid(),
    farmerName: 'Kuzey Çiftliği',
    supplierName: 'Anadolu Yem',
    address: { city: 'Samsun', district: 'Atakum' },
    deliveryWindow: { start: '2025-11-09', end: '2025-11-10' },
    items: [{ name: 'Kesif Yem Enerji', qtyKg: 600, unitPrice: 12.2 }],
    totals: { subtotal: 7320, freight: 1600, vat: 0, grand: 8920 },
    status: 'CANCELLED',
    createdAt: '2025-11-02T08:00:00Z',
    source: 'MARKET',
  },
];

const shipSchema = Yup.object().shape({
  carrier: Yup.string().required('Taşıyıcı zorunlu'),
  trackingNumber: Yup.string().required('Takip no zorunlu'),
});

const TedarikciMarketSiparisleri = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Market Siparişleri'));
  }, [dispatch]);

  // state
  const [orders, setOrders] = useState<MarketOrder[]>(MOCK_ORDERS);
  const [tab, setTab] = useState<TabStatus>('ALL'); // 👈 başlangıç: Tümü
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // sekmelerin rozet sayıları
  const counts = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        acc.ALL++;
        acc[o.status]++;
        return acc;
      },
      {
        ALL: 0,
        PENDING_APPROVAL: 0,
        PREPARING: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      } as Record<TabStatus | OrderStatus, number>
    );
  }, [orders]);

  // helpers
  const filtered = useMemo(() => {
    let list = tab === 'ALL' ? orders : orders.filter((o) => o.status === tab);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (o) =>
          o.farmerName.toLowerCase().includes(s) ||
          o.supplierName.toLowerCase().includes(s) ||
          o.items.some((i) => i.name.toLowerCase().includes(s)) ||
          o.address.city.toLowerCase().includes(s) ||
          o.address.district.toLowerCase().includes(s),
      );
    }
    if (dateFrom) list = list.filter((o) => o.deliveryWindow.start >= dateFrom);
    if (dateTo) list = list.filter((o) => o.deliveryWindow.end <= dateTo);
    return list.sort((a, b) => a.deliveryWindow.start.localeCompare(b.deliveryWindow.start));
  }, [orders, tab, q, dateFrom, dateTo]);

  // actions
  const approve = async (o: MarketOrder) => {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'PREPARING' } : x)));
    Swal.fire({ icon: 'success', title: 'Sipariş onaylandı', timer: 1000, showConfirmButton: false });
  };

  const reject = async (o: MarketOrder) => {
    const res = await Swal.fire({
      title: 'Red sebebi',
      input: 'text',
      inputPlaceholder: 'Stok, mesafe vb.',
      showCancelButton: true,
      confirmButtonText: 'Reddet',
      cancelButtonText: 'Vazgeç',
    });
    if (res.isConfirmed) {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'CANCELLED' } : x)));
      Swal.fire({ icon: 'success', title: 'Reddedildi', timer: 900, showConfirmButton: false });
    }
  };

  const createShipment = async (o: MarketOrder) => {
    let modalOpen = true;
    const onClose = () => (modalOpen = false);

    const Modal = () => (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black p-5 shadow-lg">
          <h6 className="font-semibold mb-4">Sevkiyat Oluştur</h6>
          <Formik
            initialValues={{ carrier: '', trackingNumber: '' }}
            validationSchema={shipSchema}
            onSubmit={(vals) => {
              setOrders((prev) =>
                prev.map((x) =>
                  x.id === o.id
                    ? {
                      ...x,
                      status: 'SHIPPED',
                      shipment: {
                        carrier: vals.carrier,
                        trackingNumber: vals.trackingNumber,
                        status: 'IN_TRANSIT',
                        events: [{ at: new Date().toISOString(), note: 'Araç yüklendi' }],
                      },
                    }
                    : x,
                ),
              );
              Swal.fire({ icon: 'success', title: 'Sevkiyat oluşturuldu', timer: 1000, showConfirmButton: false });
              onClose();
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
                  <Field name="trackingNumber" className="form-input" />
                  {touched.trackingNumber && errors.trackingNumber && (
                    <div className="text-danger text-xs mt-1">{String(errors.trackingNumber)}</div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                    Kapat
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Oluştur
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    // @ts-ignore
    const Root = window.ReactDOM?.createRoot ? window.ReactDOM.createRoot(container) : null;
    if (Root) {
      Root.render(<Modal />);
      const tick = () => {
        if (!modalOpen) {
          Root.unmount();
          document.body.removeChild(container);
        } else requestAnimationFrame(tick);
      };
      tick();
    }
  };

  const markDelivered = (o: MarketOrder) => {
    setOrders((prev) =>
      prev.map((x) =>
        x.id === o.id
          ? {
            ...x,
            status: 'DELIVERED',
            shipment: x.shipment
              ? { ...x.shipment, status: 'DELIVERED', events: [...x.shipment.events, { at: new Date().toISOString(), note: 'Teslim edildi' }] }
              : x.shipment,
          }
          : x,
      ),
    );
    Swal.fire({ icon: 'success', title: 'Teslim edildi işaretlendi', timer: 900, showConfirmButton: false });
  };

  const completeOrder = (o: MarketOrder) => {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'COMPLETED' } : x)));
    Swal.fire({ icon: 'success', title: 'Sipariş tamamlandı', timer: 900, showConfirmButton: false });
  };

  const cancelOrder = async (o: MarketOrder) => {
    const res = await Swal.fire({ title: 'İptal edilsin mi?', icon: 'warning', showCancelButton: true, confirmButtonText: 'İptal Et', cancelButtonText: 'Vazgeç' });
    if (res.isConfirmed) {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'CANCELLED' } : x)));
      Swal.fire({ icon: 'success', title: 'İptal edildi', timer: 900, showConfirmButton: false });
    }
  };

  // view helpers
  const TabButton = ({ s, label }: { s: TabStatus; label: string }) => (
    <button
      className={`px-3 py-2 rounded-md text-sm border ${tab === s ? 'bg-primary text-white border-primary' : 'border-white-dark dark:border-[#1b2e4b]'}`}
      onClick={() => setTab(s)}
    >
      {label}
      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">{counts[s]}</span>
    </button>
  );

  return (
    <>
      {/* Header */}
      <div className="panel p-5 mb-4">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-lg">Market Siparişleri</h5>
          <div className="flex gap-2">
            <TabButton s="ALL" label="Tümü" /> {/* 👈 eklendi */}
            <TabButton s="PENDING_APPROVAL" label="Onay Bekliyor" />
            <TabButton s="PREPARING" label="Hazırlanan" />
            <TabButton s="SHIPPED" label="Sevk Edilen" />
            <TabButton s="DELIVERED" label="Teslim Edilen" />
            <TabButton s="COMPLETED" label="Tamamlanan" />
            <TabButton s="CANCELLED" label="İptal Edilen" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="form-input" placeholder="Ara (çiftçi/ürün/şehir)..." value={q} onChange={(e) => setQ(e.target.value)} />
          <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button className="btn btn-outline-primary" onClick={() => { setQ(''); setDateFrom(''); setDateTo(''); }}>
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filtered.map((o) => (
          <div key={o.id} className="panel p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-base">{o.farmerName}</div>
                <div className="text-xs text-white-dark">
                  {o.address.city}, {o.address.district} • Teslim: {o.deliveryWindow.start} → {o.deliveryWindow.end}
                </div>
                <div className="mt-1 text-sm">
                  {o.items.map((i, idx) => (
                    <span key={idx} className="inline-block mr-3">
                      <span className="font-medium">{i.name}</span> — {kg(i.qtyKg)} × {tl(i.unitPrice)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white-dark">Toplam Kg: {sumKg(o.items)}</div>
                <div className="text-lg font-semibold">{tl(o.totals.grand)}</div>
                <div className="text-xs text-white-dark">Navlun: {tl(o.totals.freight)}</div>
              </div>
            </div>

            {/* shipment info */}
            {o.shipment && (
              <div className="mt-3 rounded border border-white-light dark:border-[#1b2e4b] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Kargo:</span> {o.shipment.carrier} — <span className="font-medium">Takip:</span> {o.shipment.trackingNumber}
                  </div>
                  <div>
                    <span className="badge badge-outline-primary">{o.shipment.status === 'IN_TRANSIT' ? 'Yolda' : 'Teslim'}</span>
                  </div>
                </div>
                <ul className="mt-2 text-xs list-disc pl-4">
                  {o.shipment.events.map((e, i) => (
                    <li key={i}>
                      {new Date(e.at).toLocaleString('tr-TR')} — {e.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.status === 'PENDING_APPROVAL' && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => approve(o)}>
                    Onayla
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => reject(o)}>
                    Red
                  </button>
                </>
              )}
              {o.status === 'PREPARING' && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => createShipment(o)}>
                    Sevkiyat Oluştur
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o)}>
                    İptal
                  </button>
                </>
              )}
              {o.status === 'SHIPPED' && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => markDelivered(o)}>
                    Teslim Edildi
                  </button>
                </>
              )}
              {o.status === 'DELIVERED' && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => completeOrder(o)}>
                    Tamamla
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="panel p-6 text-center text-white-dark">Bu sekmede kayıt yok.</div>
        )}
      </div>
    </>
  );
};

export default TedarikciMarketSiparisleri;

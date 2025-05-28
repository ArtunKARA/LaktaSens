import React, { useEffect, useState, useMemo } from 'react';
import { t } from 'i18next';
import { Eye } from 'lucide-react';

/* ---------- Tip Tanımları ---------- */
export interface IBesinDetail {
    tipAdi: string;
    birimAdi: string;
    toplamMiktar: number;
}
export interface IDonemData {
    donem: 'Gebelik' | 'Kuru' | 'Sagmal' | 'Yavru';
    hayvanAdedi: number;
    details: IBesinDetail[];
}
export type THayvanIhtiyacResponse = IDonemData[];

/* ---------- Yardımcı sabitler ---------- */
const SERVICE_DONEMLER = ['Kuru', 'Sagmal', 'Gebelik'] as const;
const COLOR_MAP: Record<string, string> = {
    Gebelik: 'from-green-600 to-green-500',
    Sagmal: 'from-indigo-500 to-indigo-400',
    Kuru: 'from-orange-600 to-orange-500',
    Serviste: 'from-pink-600 to-pink-500',
    Toplam: 'from-purple-700 to-purple-600',
    Yavru: 'from-teal-500 to-teal-400',
};

/* ---------- Kart Bileşeni ---------- */
interface CardProps {
    title: string;
    hayvanAdedi: number;
    details: IBesinDetail[];
    gradient: string;
}
const Card: React.FC<CardProps> = ({ title, hayvanAdedi, details, gradient }) => (
    <div className={`panel bg-gradient-to-r ${gradient} text-white`}>
        <div className="flex justify-between">
            <div className="text-md font-semibold">{title}</div>
        </div>

        <div className="flex items-center mt-5">
            <div className="text-3xl font-bold mr-3">{hayvanAdedi}</div>
            <div className="badge bg-white/30">{t('Head')}</div>
        </div>

        <div className="border-t border-white/30 my-4" />
        <div className="flex items-center font-semibold mt-5">
            <Eye className="mr-2 w-4 h-4" />
            {t('Daily Requirement')}
        </div>
        <ul className="mt-5 space-y-1 text-sm font-medium">
            {details.map((d) => (
                <li key={d.tipAdi} className="flex items-center justify-between">
                    <span>{d.tipAdi}</span>
                    <span>
                        {d.toplamMiktar} {d.birimAdi}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

/* ---------- Ana Bileşen ---------- */
export default function NutritionCards() {
    /* 1️⃣  STATE’LER */
    const [data, setData] = useState<THayvanIhtiyacResponse>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* 2️⃣  API ÇAĞRISI */
    useEffect(() => {
        async function fetchData() {
            try {
                const storedUserInfo = localStorage.getItem('userInfo');
                const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

                const res = await fetch('http://localhost:3030/api/cifci/depo/postHayvanYemIhtiyac', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firmaID: userInfo?.firmaID }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: THayvanIhtiyacResponse = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message ?? 'Bilinmeyen hata');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    /* 3️⃣  TÜREMİŞ VERİLER (useMemo ile) */
    const { servisteHayvanAdedi, servisteDetails, tumHayvanAdedi, tumDetails, yavruData } = useMemo(() => {
        const serviceData = data.filter((d) => SERVICE_DONEMLER.includes(d.donem as (typeof SERVICE_DONEMLER)[number]));
        const yavru = data.find((d) => d.donem === 'Yavru') ?? {
            donem: 'Yavru',
            hayvanAdedi: 0,
            details: [] as IBesinDetail[],
        };

        /* Serviste (Kuru + Sağmal + Gebelik) toplamları */
        const servisteHayvan = serviceData.reduce((acc, cur) => acc + cur.hayvanAdedi, 0);
        const servisteDet: Record<string, IBesinDetail> = {};
        serviceData.forEach((cur) =>
            cur.details.forEach((n) => {
                servisteDet[n.tipAdi] = {
                    tipAdi: n.tipAdi,
                    birimAdi: n.birimAdi,
                    toplamMiktar: (servisteDet[n.tipAdi]?.toplamMiktar ?? 0) + n.toplamMiktar,
                };
            })
        );

        /* Tüm sürü (Serviste + Yavru) */
        const tumHayvan = servisteHayvan + yavru.hayvanAdedi;
        const tumDet: Record<string, IBesinDetail> = { ...servisteDet };
        yavru.details.forEach((n) => {
            tumDet[n.tipAdi] = {
                tipAdi: n.tipAdi,
                birimAdi: n.birimAdi,
                toplamMiktar: (tumDet[n.tipAdi]?.toplamMiktar ?? 0) + n.toplamMiktar,
            };
        });

        return {
            servisteHayvanAdedi: servisteHayvan,
            servisteDetails: servisteDet,
            tumHayvanAdedi: tumHayvan,
            tumDetails: tumDet,
            yavruData: yavru,
        };
    }, [data]);

    /* 4️⃣  YÜKLENİYOR / HATA GÖRÜNÜMLERİ */
    if (loading) return <p>{t('Loading...')}</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    /* 5️⃣  KARTLARI OLUŞTURMA */
    const toplamCard = (
        <Card
            key="Toplam"
            title={t('Total (All)')}
            hayvanAdedi={tumHayvanAdedi}
            details={Object.values(tumDetails).map((d) => ({
                ...d,
                toplamMiktar: Number(d.toplamMiktar.toFixed(2)),
            }))}
            gradient={COLOR_MAP.Toplam}
        />
    );

    const servisteCard = (
        <Card
            key="Serviste"
            title={t('Service')}
            hayvanAdedi={servisteHayvanAdedi}
            details={Object.values(servisteDetails).map((d) => ({
                ...d,
                toplamMiktar: Number(d.toplamMiktar.toFixed(2)),
            }))}
            gradient={COLOR_MAP.Serviste}
        />
    );

    const yavruCard = <Card key="Yavru" title={t('Newborn')} hayvanAdedi={yavruData.hayvanAdedi} details={yavruData.details} gradient={COLOR_MAP.Yavru} />;

    const detailCards = SERVICE_DONEMLER.map((donem) => {
        const d = data.find((x) => x.donem === donem) ?? {
            donem,
            hayvanAdedi: 0,
            details: [],
        };
        return <Card key={donem} title={donem} hayvanAdedi={d.hayvanAdedi} details={d.details} gradient={COLOR_MAP[donem]} />;
    });

    /* 6️⃣  TAM GRID */
    return (
        <div className="grid lg:grid-cols-1 gap-6 mb-6">
            <div className="panel h-full p-0">
                <div className="p-5 border-b border-white-light dark:border-[#1b2e4b]">
                    <h5 className="font-semibold text-lg">{t('Distribution of Animals')}</h5>
                </div>

                <div className="m-6">
                    {/* Üst sıra */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                        {toplamCard}
                        {servisteCard}
                        {yavruCard}
                    </div>

                    {/* Alt başlık */}
                    <div className="mb-5 border-b border-white-light dark:border-[#1b2e4b]">
                        <h6 className="font-medium mb-3 px-1 text-gray-500">{t('Total Distribution of Animals')}</h6>
                    </div>

                    {/* Alt sıra */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{detailCards}</div>
                </div>
            </div>
        </div>
    );
}

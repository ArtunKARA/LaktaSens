import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';
import { Eye } from 'lucide-react';

interface DongulereGoreIhtıyacAnalizi {
    firmaID: number;
}

/** Tek besin kalemi */
export interface IBesinDetail {
    tipAdi: string; // ör. "Kuru Madde"
    birimAdi: string; // ör. "kg", "%km"
    toplamMiktar: number; // 24.0
}

/** Bir fizyolojik dönemlik çıktı */
export interface IDonemData {
    donem: 'Gebelik' | 'Kuru' | 'Sagmal' | 'Yavru';
    hayvanAdedi: number; // baş
    details: IBesinDetail[];
}

/** API cevabı: sabit sıralı dizi (Gebelik, Kuru, Sagmal, Yavru) */
export type THayvanIhtiyacResponse = IDonemData[];

const DongulereGoreIhtıyacAnalizi: React.FC<DongulereGoreIhtıyacAnalizi> = ({}) => {
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'yillik' | 'haftalik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [data, setData] = useState<THayvanIhtiyacResponse>([]);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postHayvanYemIhtiyac', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }),
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setData(data); // burada o datanın set edilmesi olacak
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    // You should return some JSX here, for now return null or your actual UI
    return null;
};

const rawData = [
    {
        donem: 'Gebelik',
        hayvanAdedi: 2,
        details: [
            { tipAdi: 'Kuru Madde', birimAdi: 'kg', toplamMiktar: 24.0 },
            { tipAdi: 'Ham Protein', birimAdi: '%km', toplamMiktar: 26.0 },
            { tipAdi: 'Net Enerji', birimAdi: 'Mcal/kg', toplamMiktar: 18.0 },
            { tipAdi: 'Kalsiyum', birimAdi: '%km', toplamMiktar: 1.2 },
            { tipAdi: 'Fosfor', birimAdi: '%km', toplamMiktar: 0.76 },
        ],
    },
    {
        donem: 'Sagmal',
        hayvanAdedi: 3,
        details: [
            { tipAdi: 'Kuru Madde', birimAdi: 'kg', toplamMiktar: 60.0 },
            { tipAdi: 'Ham Protein', birimAdi: '%km', toplamMiktar: 48.0 },
            { tipAdi: 'Net Enerji', birimAdi: 'Mcal/kg', toplamMiktar: 36.0 },
            { tipAdi: 'Kalsiyum', birimAdi: '%km', toplamMiktar: 2.4 },
            { tipAdi: 'Fosfor', birimAdi: '%km', toplamMiktar: 1.35 },
        ],
    },
    {
        donem: 'Yavru',
        hayvanAdedi: 0,
        details: [
            { tipAdi: 'Kuru Madde', birimAdi: 'kg', toplamMiktar: 0 },
            { tipAdi: 'Ham Protein', birimAdi: '%km', toplamMiktar: 0 },
            { tipAdi: 'Net Enerji', birimAdi: 'Mcal/kg', toplamMiktar: 0 },
            { tipAdi: 'Kalsiyum', birimAdi: '%km', toplamMiktar: 0 },
            { tipAdi: 'Fosfor', birimAdi: '%km', toplamMiktar: 0 },
        ],
    },
] as const;

// Yardımcı hesaplamalar
const serviceDonemler = ['Kuru', 'Sagmal', 'Gebelik'] as const;
const serviceData = rawData.filter((d) => serviceDonemler.includes(d.donem as (typeof serviceDonemler)[number]));
const yavruData = rawData.find((d) => d.donem === 'Yavru') ?? {
    donem: 'Yavru',
    hayvanAdedi: 0,
    details: [],
};

// Serviste toplamı
const servisteHayvanAdedi = serviceData.reduce((acc, cur) => acc + cur.hayvanAdedi, 0);
const servisteDetails = serviceData.reduce<Record<string, { birimAdi: string; toplamMiktar: number }>>((acc, cur) => {
    cur.details.forEach((n) => {
        acc[n.tipAdi] = {
            birimAdi: n.birimAdi,
            toplamMiktar: (acc[n.tipAdi]?.toplamMiktar || 0) + n.toplamMiktar,
        };
    });
    return acc;
}, {});

// Tüm sürü toplamı (Serviste + Yavru)
const tumHayvanAdedi = servisteHayvanAdedi + yavruData.hayvanAdedi;
const tumDetails: Record<string, { birimAdi: string; toplamMiktar: number }> = { ...servisteDetails };
yavruData.details.forEach((n) => {
    tumDetails[n.tipAdi] = {
        birimAdi: n.birimAdi,
        toplamMiktar: (tumDetails[n.tipAdi]?.toplamMiktar || 0) + n.toplamMiktar,
    };
});

// Kart renkleri
const colorMap: Record<string, string> = {
    Gebelik: 'from-green-600 to-green-500', // koyu yeşil geçiş
    Sagmal: 'from-indigo-500 to-indigo-400', // morumsu mavi geçiş
    Kuru: 'from-orange-600 to-orange-500', // canlı turuncu geçiş
    Serviste: 'from-pink-600 to-pink-500', // parlak pembe geçiş
    Toplam: 'from-purple-700 to-purple-600', // derin mor geçiş
    Yavru: 'from-teal-500 to-teal-400', // turkuaz / teal geçiş
};

/* ------------------------------------------------------------- */
// Kart bileşeni
interface CardProps {
    title: string;
    hayvanAdedi: number;
    details: { tipAdi: string; birimAdi: string; toplamMiktar: number }[];
    gradient: string;
}

const Card: React.FC<CardProps> = ({ title, hayvanAdedi, details, gradient }) => (
    <div className={`panel bg-gradient-to-r ${gradient} text-white`}>
        <div className="flex justify-between">
            <div className="ltr:mr-1 rtl:ml-1 text-md font-semibold">{title}</div>
        </div>

        <div className="flex items-center mt-5">
            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{hayvanAdedi}</div>
            <div className="badge bg-white/30">{t('Head')}</div>
        </div>

        <div className="border-t border-white/30 my-4" />
        <div className="flex items-center font-semibold mt-5">
            <Eye className="ltr:mr-2 rtl:ml-2 shrink-0 w-4 h-4" />
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

/* ------------------------------------------------------------- */
export default function NutritionCards() {
    // Toplam kartı (Serviste + Yavru)
    const toplamCard = (
        <Card
            key="Toplam"
            title={t('Total (All)')}
            hayvanAdedi={tumHayvanAdedi}
            details={Object.keys(tumDetails).map((k) => ({
                tipAdi: k,
                birimAdi: tumDetails[k].birimAdi,
                toplamMiktar: Number(tumDetails[k].toplamMiktar.toFixed(2)),
            }))}
            gradient={colorMap['Toplam']}
        />
    );

    // Serviste kartı (Kuru + Sağmal + Gebelik)
    const servisteCard = (
        <Card
            key="Serviste"
            title={t('Service')}
            hayvanAdedi={servisteHayvanAdedi}
            details={Object.keys(servisteDetails).map((k) => ({
                tipAdi: k,
                birimAdi: servisteDetails[k].birimAdi,
                toplamMiktar: Number(servisteDetails[k].toplamMiktar.toFixed(2)),
            }))}
            gradient={colorMap['Serviste']}
        />
    );

    // Yavru kartı
    const yavruCard = <Card key="Yavru" title={t('Newborn')} hayvanAdedi={yavruData.hayvanAdedi} details={yavruData.details.slice()} gradient={colorMap['Yavru']} />;

    // Alt sıra: Serviste detay kartları (Kuru / Sağmal / Gebelik)
    const detailCards = serviceDonemler.map((donem) => {
        const data = rawData.find((d) => d.donem === donem) || {
            donem,
            hayvanAdedi: 0,
            details: [] as unknown as (typeof rawData)[0]['details'],
        };
        return <Card key={donem} title={donem} hayvanAdedi={data.hayvanAdedi} details={data.details.slice()} gradient={colorMap[donem]} />;
    });

    return (
        <div className="grid lg:grid-cols-1 gap-6 mb-6">
            <div className="px-3">
                <div className="grid lg:grid-cols-1 gap-6 mb-6">
                    <div className="panel h-full p-0 lg:col-span-1">
                        <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b border-white-light dark:border-[#1b2e4b]">
                            <h5 className="font-semibold text-lg">{t('Daily Needs Analysis')}</h5>
                        </div>
                        <div className="m-6">
                            <div className="flex items-start justify-between dark:text-white-light mb-5 border-b border-white-light dark:border-[#1b2e4b]">
                                <h6 className="font-medium mb-3 px-1 text-gray-500">{t('Daily Needs')}</h6>
                            </div>
                            {/* Üst sıra: Toplam + Serviste + Yavru */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                                {toplamCard}
                                {servisteCard}
                                {yavruCard}
                            </div>
                            <div className="flex items-start justify-between dark:text-white-light mb-5 border-b border-white-light dark:border-[#1b2e4b]">
                                <h6 className="font-medium mb-3 px-1 text-gray-500">{t('Cycle Needs Analysis')}</h6>
                            </div>
                            {/* Alt sıra: Kuru / Sağmal / Gebelik */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{detailCards}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* export default GenelHayvanDurumu; */

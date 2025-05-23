import React, { useEffect, useState } from 'react';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';
import ReactApexChart from 'react-apexcharts';
import { t } from 'i18next';
import Dropdown from '../Dropdown';
import IconHorizontalDots from '../Icon/IconHorizontalDots';

interface TuketimAnalizProps {
    yemID: any;
    firmaID: number;
}

interface AnaData {
    yemAdi: string;
    zamanGrubu: string;
    tuketimKg: string;
    depoStok: string;
}

const TuketimAnaliz: React.FC<TuketimAnalizProps> = ({ yemID, firmaID }) => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [consumData, setConsumData] = useState<AnaData[]>([]);
    const [loading] = useState(false);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'yillik' | 'haftalik'>('aylik');
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const today = new Date();
    const [futureCount, setFutureCount] = useState(0);
    function parseZamanGrubu(str: string, tip: 'yillik' | 'aylik' | 'haftalik'): Date | null {
        if (!str) return null;

        if (tip === 'yillik') {
            const y = Number(str);
            return isNaN(y) ? null : new Date(y, 0, 1); // 1 Ocak
        }

        if (tip === 'aylik') {
            // "2025-04"
            const [y, m] = str.split('-').map(Number);
            return isNaN(y) || isNaN(m) ? null : new Date(y, m - 1, 1);
        }

        if (tip === 'haftalik') {
            // "2025-17"
            const [y, w] = str.split('-').map(Number);
            if (isNaN(y) || isNaN(w)) return null;
            // ISO‑8601: 4 Ocak içeren hafta 1’dir
            const jan4 = new Date(y, 0, 4);
            const jan4Day = jan4.getDay() || 7; // Pazar=7
            const offset = (w - 1) * 7 + (1 - jan4Day);
            const monday = new Date(jan4);
            monday.setDate(jan4.getDate() + offset);
            return monday; // haftanın ilk günü
        }

        return null;
    }
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postCiflikYemTuketimAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, yemID: yemID, zamanTipi: zamanTipi }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setConsumData(data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipi, yemID, firmaID]);

    useEffect(() => {
        const dataArr = Array.isArray(consumData) ? consumData : [];
        const today = new Date();

        const count = dataArr.reduce((acc, d) => {
            const dt = parseZamanGrubu(d.zamanGrubu, zamanTipi); // 👈 doğru parser
            return dt && dt > today ? acc + 1 : acc;
        }, 0);

        setFutureCount(count);
        console.log('Gelecek veri sayısı:', count);
    }, [consumData, zamanTipi]); // 👈 consumData eklendi

    const mixedChart: any = {
        series: [
            {
                name: t('Warehouse Stock'),
                type: 'area',
                data: consumData.length > 0 ? consumData.map((d) => d.depoStok) : [0],
                forecastDataPoints: {
                    // <-- YENİ
                    count: futureCount, // kaç nokta gelecek?
                    dashArray: 5, // kesik çizgi uzunluğu
                    fillOpacity: 0.15, // alan rengi daha soluk
                },
            },
            {
                name: t('Consumption'),
                type: 'line',
                data: consumData.length > 0 ? consumData.map((d) => d.tuketimKg) : [0],
                forecastDataPoints: {
                    count: futureCount,
                    dashArray: 5,
                },
            },
        ],
        options: {
            chart: {
                id: 'consumption-mixed',
                type: 'line', // <-- Hata buradan çıkıyordu
                height: 300,
                zoom: { enabled: false },
                toolbar: { show: false },
            },

            /*  forecastDataPoints artık doğru yerde  */
            forecastDataPoints: {
                count: futureCount, // son N noktayı tahmin olarak işaretle
                dashArray: 5,
                fillOpacity: 0.15,
            },
            dataLabels: {
                enabled: false,
            },
            colors: ['#00ab55', '#4361ee'],
            stroke: {
                width: [2, 2],
                curve: 'smooth',
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            fill: {
                opacity: [0.25, 1],
            },
            labels: consumData.length > 0 ? consumData?.map((item) => item.zamanGrubu) : [0],
            markers: {
                size: 0,
            },
            xaxis: {
                type: 'string',
                axisBorder: {
                    color: isDark ? '#191e3a' : '#e0e6ed',
                },
            },
            yaxis: {
                title: {
                    text: t('Consumption (kg)'),
                },
                min: 0,
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
            },
            tooltip: {
                shared: true,
                intersect: false,
                theme: isDark ? 'dark' : 'light',
            },
            legend: {
                itemMargin: {
                    horizontal: 4,
                    vertical: 8,
                },
            },
        },
    };

    return (
        <div>
            <div className="grid lg:grid-cols-1 gap-6 mb-6">
                <div className="panel h-full p-0 lg:col-span-1">
                    <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                        <h5 className="font-semibold text-lg ">{t('Consumption Chart of the Selected Product and Forecast Based on Average Consumption')}</h5>
                        <div className="dropdown">
                            <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                                <ul>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('haftalik')}>
                                            {t('Weekly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('aylik')}>
                                            {t('Monthly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('yillik')}>
                                            {t('Yearly')}
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>

                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={mixedChart.series} options={mixedChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="bar" height={300} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TuketimAnaliz;

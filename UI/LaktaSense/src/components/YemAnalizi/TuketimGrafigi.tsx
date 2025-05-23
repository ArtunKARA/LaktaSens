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
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface FeedStockMovement {
    period: string;
    kumulatifKg: number;
}

interface ZamanData {
    yemAdi: string;
    zamanGrubu: string;
    toplamTuketimKg: string;
}

const TuketimGrafigi: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'haftalik' | 'yillik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [stockMovement, setStockMovement] = useState<FeedStockMovement[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postStokEgilimi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, startDate: startDate, endDate: endDate, granularity: zamanTipi }),
                });
                const data = await response.json();
                setStockMovement(data);
                setLoading(false);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipi, startDate, endDate]);
    const [timeData, setTimeData] = useState<ZamanData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postTuketimZamanliGrafik', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, zamanTipi: zamanTipi }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                setTimeData(data);
                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipi]);

    // 1. Yem bazlı gruplama yapacağız
    const yemMap = new Map<string, { [key: string]: number }>();

    timeData.forEach((item) => {
        if (!yemMap.has(item.yemAdi)) {
            yemMap.set(item.yemAdi, {});
        }
        yemMap.get(item.yemAdi)![item.zamanGrubu] = parseFloat(item.toplamTuketimKg);
    });

    // 2. Tüm zaman gruplarını (tarihleri) bulup sıraya dizelim
    const zamanGruplariSet = new Set<string>();
    timeData.forEach((item) => zamanGruplariSet.add(item.zamanGrubu));
    const zamanGruplari = Array.from(zamanGruplariSet).sort(); // sıralı olsun

    // 3. Series dizisini oluşturalım
    const series = Array.from(yemMap.entries()).map(([yemAdi, zamanVerileri]) => ({
        name: yemAdi,
        data: zamanGruplari.map((zaman) => zamanVerileri[zaman] ?? 0), // veri yoksa 0
    }));

    // 4. Final Chart Config
    const tuketimrSeries: any = {
        series,
        options: {
            chart: {
                height: 360,
                type: 'bar',
                fontFamily: 'Nunito, sans-serif',
                toolbar: { show: false },
            },
            dataLabels: { enabled: false },
            stroke: { width: 2, colors: ['transparent'] },
            colors: timeData.map(
                () =>
                    `#${Math.floor(Math.random() * 16777215)
                        .toString(16)
                        .padStart(6, '0')}`
            ),
            dropShadow: {
                enabled: true,
                blur: 3,
                color: '#515365',
                opacity: 0.4,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 8,
                    borderRadiusApplication: 'end',
                },
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                itemMargin: { horizontal: 8, vertical: 8 },
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
                padding: { left: 20, right: 20 },
                xaxis: { lines: { show: false } },
            },
            xaxis: {
                categories: zamanGruplari, // zamanlar burada dinamik
                axisBorder: {
                    show: true,
                    color: isDark ? '#3b3f5c' : '#e0e6ed',
                },
            },
            yaxis: { tickAmount: 6 },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: isDark ? 'dark' : 'light',
                    type: 'vertical',
                    shadeIntensity: 0.3,
                    inverseColors: false,
                    opacityFrom: 1,
                    opacityTo: 0.8,
                    stops: [0, 100],
                },
            },
            tooltip: { marker: { show: true } },
        },
    };

    return (
        <div>
            <div className="panel h-full p-0">
                <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                    <h5 className="font-semibold text-lg ">{t('Consumption Graph')}</h5>
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

                <ReactApexChart options={tuketimrSeries.options} series={tuketimrSeries.series} type="bar" height={360} className="overflow-hidden" />
            </div>
        </div>
    );
};

export default TuketimGrafigi;

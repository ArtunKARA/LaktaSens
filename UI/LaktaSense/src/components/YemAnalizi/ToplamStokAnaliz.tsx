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

const ToplamStokAnaliz: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'gunluk'>('aylik');
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

    const areaChart: any = {
        series: [
            {
                name: 'Income',
                data: stockMovement.map((item) => item.kumulatifKg),
            },
        ],
        options: {
            chart: {
                type: 'area',
                height: 300,
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            colors: ['#805dca'],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 2,
                curve: 'smooth',
            },
            xaxis: {
                axisBorder: {
                    color: isDark ? '#191e3a' : '#e0e6ed',
                },
            },
            labels: stockMovement.map((item) => item.period),
            legend: {
                horizontalAlign: 'left',
            },
            grid: {
                borderColor: isDark ? '#191E3A' : '#E0E6ED',
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
            },
        },
    };

    return (
        <div>
            <div className="panel h-full p-0 lg:col-span-1">
                <div className="flex items-start justify-between dark:text-white-light p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                    <h5 className="font-semibold text-lg ">{t('Total Stock Trend')}</h5>
                    <div className="flex items-start gap-2 ml-auto">
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">{t('Start Date')}</label>
                            <Flatpickr
                                value={startDate}
                                options={{ dateFormat: 'Y-m-d' }}
                                className="form-input"
                                placeholder={t('Select start date')}
                                onChange={(date: Date[]) => setStartDate(date[0] ? date[0].toISOString().slice(0, 10) : '')}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">{t('End Date')}</label>
                            <Flatpickr
                                value={endDate}
                                options={{ dateFormat: 'Y-m-d' }}
                                className="form-input"
                                placeholder={t('Select end date')}
                                onChange={(date: Date[]) => setEndDate(date[0] ? date[0].toISOString().slice(0, 10) : '')}
                            />
                        </div>
                    </div>
                    <div className="dropdown p-5">
                        <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                            <ul>
                                <li>
                                    <button type="button" onClick={() => setzamanTipi('gunluk')}>
                                        {t('Daily')}
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => setzamanTipi('aylik')}>
                                        {t('Monthly')}
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
                    <ReactApexChart series={areaChart.series} options={areaChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="area" height={300} />
                )}
            </div>
        </div>
    );
};

export default ToplamStokAnaliz;

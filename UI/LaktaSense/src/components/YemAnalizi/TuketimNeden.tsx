import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface FeedData {
    nedenAdi: string;
    toplamKg: number;
}

const TuketimNeden: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'haftalik' | 'yillik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rawData, setRawData] = useState<FeedData[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postTuketimNeden', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, startDate: startDate, endDate: endDate }),
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRawData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
                setLoading(false); // Yükleme durumunu güncelle
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const stackedSeries = rawData.map((i) => ({
        name: i.nedenAdi,
        data: [i.toplamKg], // tek kategoride toplanıyor
    }));

    const total = rawData.reduce((s, i) => s + i.toplamKg, 0);

    const stackedOptions: any = {
        chart: {
            type: 'bar',
            stacked: true,
            stackType: '100%',
            height: 300,
            toolbar: {
                show: false,
            },
        },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: [''] }, // tek “Toplam” kategorisi
        tooltip: {
            y: {
                formatter: (val: number) => `${val} kg  (${((val / total) * 100).toFixed(1)} %)`,
            },
        },
        legend: { position: 'bottom' },
        fill: { opacity: 0.9 },
    };

    return (
        <div className="panel h-full">
            <div className="flex items-center mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">{t('Consumption Reason Breakdown')}</h5>
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
            </div>
            <div>
                <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={stackedSeries} options={stackedOptions} type="bar" height={300} className="rounded-lg bg-white dark:bg-black" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TuketimNeden;

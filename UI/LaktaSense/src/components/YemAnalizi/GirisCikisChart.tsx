// GirisCikisChart.tsx
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { t } from 'i18next';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Dropdown from '../Dropdown';
import IconHorizontalDots from '../Icon/IconHorizontalDots';

interface Row {
    period: string; // YYYY-MM
    girisKg: number;
    cikisKg: number;
}

export default function GirisCikisChart() {
    /* -------- 1) Veriyi yükle (yerine API) -------------------------- */
    const [rows, setRows] = useState<Row[]>([]);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'gunluk'>('aylik');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postGirisCikis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, startDate: startDate, endDate: endDate }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRows(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
                setLoading(false);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    /* -------- 2) Series -------------------------------------------------- */
    const series = [
        {
            name: 'Giriş (kg)',
            data: rows.map((r) => Number(r.girisKg.toFixed(2))),
        },
        {
            name: 'Çıkış (kg)',
            data: rows.map((r) => Number(r.cikisKg.toFixed(2))),
        },
    ];

    /* -------- 3) Opsiyonlar --------------------------------------------- */
    const options: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%', // çubuk kalınlığı
            },
        },
        stroke: { show: true, width: 1, colors: ['transparent'] },
        colors: ['#2196f3', '#e7515a'], // giriş = mavi, çıkış = kırmızı
        dataLabels: { enabled: false },
        xaxis: {
            categories: rows.map((r) => r.period),
            title: { text: 'Dönem' },
        },
        yaxis: {
            title: { text: 'kg' },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} kg`,
            },
        },
        legend: { position: 'bottom' },
    };

    /* -------- 4) JSX ----------------------------------------------------- */
    return (
        <div>
            <div className="panel h-full p-0 lg:col-span-1">
                <div className="flex items-start justify-between dark:text-white-light p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                    <h5 className="font-semibold text-lg ">{t('Input-Output Balance')}</h5>
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
                    <ReactApexChart series={series} options={options} type="bar" height={350} className="bg-white dark:bg-black rounded-lg" />
                )}
            </div>
        </div>
    );
}

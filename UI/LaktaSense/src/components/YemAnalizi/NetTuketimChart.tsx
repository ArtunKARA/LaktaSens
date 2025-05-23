import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { t } from 'i18next';

interface Row {
    yemAdi: string;
    cikisKg: number;
}

export default function NetTuketimChart() {
    /* --------- 1) Veriyi yükle (şimdilik sabit) --------------------- */
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postNetTuketim', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, startDate: startDate, endDate: endDate }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRows(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
                setLoading(false); // Yükleme durumunu güncelle
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [startDate, endDate]); // startDate ve endDate değiştiğinde veriyi yeniden yükle

    /* --------- 2) Series & Labels ----------------------------------- */
    const series = rows.map((r) => Number(r.cikisKg.toFixed(2))); // [3827.75, …]
    const labels = rows.map((r) => r.yemAdi); // ['Misir...', …]

    /* --------- 3) Opsiyonlar ---------------------------------------- */
    const options: ApexOptions = {
        chart: {
            type: 'donut',
            toolbar: { show: false }, // Download butonunu gizle
        },
        labels,
        legend: { position: 'bottom' },
        stroke: { width: 1 },
        tooltip: {
            y: {
                formatter: (val) => `${val} kg`,
            },
        },
        responsive: [
            {
                breakpoint: 480,
                options: { legend: { position: 'bottom' } },
            },
        ],
    };

    /* --------- 4) JSX ------------------------------------------------ */
    return (
        <div className="panel p-4">
            <h5 className="font-semibold text-lg mb-4 dark:text-white-light">{t('Net Consumption by Feed Type')}</h5>
            <div>
                <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={series} options={options} type="donut" height={350} className="bg-white dark:bg-black rounded-lg" />
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { set, sortBy } from 'lodash';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface FeedData {
    depoID: string;
    firmaID: string;
    yemID: string;
    yemAdi: string;
    miktarKg: number;
    sonGuncellemeTarihi: number;
}

const MevcutStokDagilimi: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'haftalik' | 'yillik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<FeedData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postStokListesi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRowData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
                setLoading(false); // Yükleme durumunu güncelle
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    const pieChartDagilim: any = {
        series: rowData.map((item) => item.miktarKg),
        options: {
            chart: {
                height: 300,
                type: 'pie',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            labels: rowData.map((item) => item.yemAdi),
            colors: rowData.map(
                () =>
                    `#${Math.floor(Math.random() * 16777215)
                        .toString(16)
                        .padStart(6, '0')}`
            ),
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200,
                        },
                    },
                },
            ],
            stroke: {
                show: false,
            },
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <div className="panel h-full">
            <div className="flex items-center mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">{t('Current Stock Distribution')}</h5>
            </div>
            <div>
                <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={pieChartDagilim.series} options={pieChartDagilim.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="pie" height={300} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MevcutStokDagilimi;

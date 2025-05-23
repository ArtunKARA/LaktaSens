import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../../../store';
import ReactApexChart from 'react-apexcharts';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../../../components/Dropdown';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import IconHorizontalDots from '../../../../components/Icon/IconHorizontalDots';

interface YemDepoTumUrunlerGecmisiAnaliz {
    yemID: number;
    yemAdi: string;
    durum: {
        zamanGrubu: string;
        depoStok: number;
    }[];
}
const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Main Menu'));
    });
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [loading] = useState(false);

    const [kuruda_olanlar, kuruda_olanlarSet] = useState<number>();
    const [sagimda_olanlar, sagimda_olanlarSet] = useState<number>();
    const [cikarilmasi_gerekenlerSut, cikarilmasi_gerekenlerSutSet] = useState<number>();
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifciAnaliz/postSutDongusuAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ID: userInfo.kullaniciID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                kuruda_olanlarSet(data['kuruda_olanlar']);
                sagimda_olanlarSet(data['sagimda_olanlar']);
                cikarilmasi_gerekenlerSutSet(data['cikarilmasi_gerekenler']);
                console.log('Gelen veri:', data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    const [gebe_olanlar, gebe_olanlarSet] = useState<number>();
    const [serviste_olanlar, serviste_olanlarSet] = useState<number>();
    const [cikarilmasi_gerekenlerYavru, cikarilmasi_gerekenlerYavruSet] = useState<number>();
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifciAnaliz/postYavruDonguAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ID: userInfo.kullaniciID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                gebe_olanlarSet(data['gebe_olanlar']);
                serviste_olanlarSet(data['serviste_olanlar']);
                cikarilmasi_gerekenlerYavruSet(data['cikarilmasi_gerekenler']);
                console.log('Gelen veri:', data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    const [eriskin_olanlar, eriskin_olanlarSet] = useState<number>();
    const [yavru_olanlar, yavru_olanlarSet] = useState<number>();
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifciAnaliz/postDongudekiIneklerAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ID: userInfo.kullaniciID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                eriskin_olanlarSet(data['eriskin_olanlar']);
                yavru_olanlarSet(data['yavru_olanlar']);
                console.log('Gelen veri:', data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    //SutDongu
    const SutDongu: any = {
        series: [kuruda_olanlar, sagimda_olanlar, cikarilmasi_gerekenlerSut],
        options: {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 25,
                colors: isDark ? '#0e1726' : '#fff',
            },
            colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#e2a03f'] : ['#e2a03f', '#5c1ac3', '#e7515a'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '29px',
                                offsetY: -10,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    return val;
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#888ea8',
                                fontSize: '29px',
                                formatter: (w: any) => {
                                    return w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                        return a + b;
                                    }, 0);
                                },
                            },
                        },
                    },
                },
            },
            labels: [t('Dry'), t('Milking'), t('Must be Checked')],
            states: {
                hover: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
            },
        },
    };

    //YavruDongu
    const YavruDongu: any = {
        series: [gebe_olanlar, serviste_olanlar, cikarilmasi_gerekenlerYavru],
        options: {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 25,
                colors: isDark ? '#0e1726' : '#fff',
            },
            colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#e2a03f'] : ['#e2a03f', '#5c1ac3', '#e7515a'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '29px',
                                offsetY: -10,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    return val;
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#888ea8',
                                fontSize: '29px',
                                formatter: (w: any) => {
                                    return w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                        return a + b;
                                    }, 0);
                                },
                            },
                        },
                    },
                },
            },
            labels: [t('Calving'), t('Service'), t('Must be Checked')],
            states: {
                hover: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
            },
        },
    };

    //aklimaGelmedi
    const aklimaGelmedi: any = {
        series: [eriskin_olanlar, yavru_olanlar],
        options: {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 25,
                colors: isDark ? '#0e1726' : '#fff',
            },
            colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#e2a03f'] : ['#e2a03f', '#5c1ac3', '#e7515a'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '29px',
                                offsetY: -10,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    return val;
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#888ea8',
                                fontSize: '29px',
                                formatter: (w: any) => {
                                    return w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                        return a + b;
                                    }, 0);
                                },
                            },
                        },
                    },
                },
            },
            labels: [t('Adult'), t('Calf')],
            states: {
                hover: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
            },
        },
    };
    const [zamanTipiDepo, setzamanTipiDepo] = useState('aylik');
    const [yemDepoTumUrunlerGecmisiAnaliz, setYemDepoTumUrunlerGecmisiAnaliz] = useState<YemDepoTumUrunlerGecmisiAnaliz[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifciAnaliz/postCiflikYemDepoTumUrunlerGecmisiAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, zamanTipi: zamanTipiDepo }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                setYemDepoTumUrunlerGecmisiAnaliz(data);

                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipiDepo]);

    const zamanGruplari = Array.from(new Set(yemDepoTumUrunlerGecmisiAnaliz.flatMap((i) => i.durum.map((d) => d.zamanGrubu)))).sort(); // ['2025-04', '2025-05', ...]

    const labels = zamanGruplari;

    const mixedChart: any = {
        series: yemDepoTumUrunlerGecmisiAnaliz.map(({ yemAdi, durum }) => ({
            name: yemAdi,
            type: 'line',
            data: zamanGruplari.map((zg) => {
                const rec = durum.find((d) => d.zamanGrubu === zg);
                return rec ? rec.depoStok : null;
            }),
        })),
        options: {
            chart: { height: 300, zoom: { enabled: false }, toolbar: { show: false } },
            dataLabels: { enabled: false },
            stroke: { width: 2, curve: 'smooth' },
            markers: { size: 0 },
            xaxis: {
                type: 'string',
                categories: labels,
                axisBorder: { color: isDark ? '#191e3a' : '#e0e6ed' },
            },
            yaxis: {
                title: { text: t('Amount (kg)') },
                min: 0,
                opposite: isRtl,
                labels: { offsetX: isRtl ? -10 : 0 },
            },
            grid: { borderColor: isDark ? '#191e3a' : '#e0e6ed' },
            tooltip: { shared: true, intersect: false, theme: isDark ? 'dark' : 'light' },
            legend: { itemMargin: { horizontal: 4, vertical: 8 } },
        },
    };

    return (
        <div>
            <div className="pt-5">
                <div className="grid xl:grid-cols-3 gap-6 mb-6">
                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Milk Cycle Analysis')}</h5>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={SutDongu.series} options={SutDongu.options} type="donut" height={460} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Calf Cycle Analysis')}</h5>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={YavruDongu.series} options={YavruDongu.options} type="donut" height={460} />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Analysis of the Number of Animals in the Cycle')}</h5>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={aklimaGelmedi.series} options={aklimaGelmedi.options} type="donut" height={460} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-5">
                <div className="grid xl:grid-cols-1 gap-6 mb-6">
                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Warehouse Stock Chart')}</h5>
                            <div className="dropdown align-items-center ml-auto">
                                <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                                    <ul>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('haftalik')}>
                                                {t('Weekly')}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('aylik')}>
                                                {t('Monthly')}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('yillik')}>
                                                {t('Yearly')}
                                            </button>
                                        </li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={mixedChart.series} options={mixedChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="line" height={300} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;

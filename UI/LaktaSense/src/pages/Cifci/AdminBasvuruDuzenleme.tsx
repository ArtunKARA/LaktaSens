import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import ReactApexChart from 'react-apexcharts';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconHorizontalDots from '../../components/Icon/IconHorizontalDots';
import IconDollarSign from '../../components/Icon/IconDollarSign';
import IconInbox from '../../components/Icon/IconInbox';
import IconTag from '../../components/Icon/IconTag';
import IconCreditCard from '../../components/Icon/IconCreditCard';
import IconShoppingCart from '../../components/Icon/IconShoppingCart';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import IconCashBanknotes from '../../components/Icon/IconCashBanknotes';
import IconUser from '../../components/Icon/IconUser';
import IconNetflix from '../../components/Icon/IconNetflix';
import IconBolt from '../../components/Icon/IconBolt';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconPlus from '../../components/Icon/IconPlus';
import IconMultipleForwardRight from '../../components/Icon/IconMultipleForwardRight';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sales Admin'));
    });
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [loading] = useState(false);

    //Revenue Chart
    const revenueChart: any = {
        series: [
            {
                name: 'Income',
                data: [16800, 16800, 15500, 17800, 15500, 17000, 19000, 16000, 15000, 17000, 14000, 17000],
            },
            {
                name: 'Expenses',
                data: [16500, 17500, 16200, 17300, 16000, 19500, 16000, 17000, 16000, 19000, 18000, 19000],
            },
        ],
        options: {
            chart: {
                height: 325,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },

            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                curve: 'smooth',
                width: 2,
                lineCap: 'square',
            },
            dropShadow: {
                enabled: true,
                opacity: 0.2,
                blur: 10,
                left: -7,
                top: 22,
            },
            colors: isDark ? ['#2196F3', '#E7515A'] : ['#1B55E2', '#E7515A'],
            markers: {
                discrete: [
                    {
                        seriesIndex: 0,
                        dataPointIndex: 6,
                        fillColor: '#1B55E2',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                    {
                        seriesIndex: 1,
                        dataPointIndex: 5,
                        fillColor: '#E7515A',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                ],
            },
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    show: true,
                },
                labels: {
                    offsetX: isRtl ? 2 : 0,
                    offsetY: 5,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-xaxis-title',
                    },
                },
            },
            yaxis: {
                tickAmount: 7,
                labels: {
                    formatter: (value: number) => {
                        return value / 1000 + 'K';
                    },
                    offsetX: isRtl ? -30 : -10,
                    offsetY: 0,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-yaxis-title',
                    },
                },
                opposite: isRtl ? true : false,
            },
            grid: {
                borderColor: isDark ? '#191E3A' : '#E0E6ED',
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                yaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '16px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5,
                },
            },
            tooltip: {
                marker: {
                    show: true,
                },
                x: {
                    show: false,
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: isDark ? 0.19 : 0.28,
                    opacityTo: 0.05,
                    stops: isDark ? [100, 100] : [45, 100],
                },
            },
        },
    };

    //SutDongu
    const SutDongu: any = {
        series: [985, 737, 270],
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
        series: [985, 737, 270],
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
        series: [985, 737, 270],
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


    

    

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Sales</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="grid xl:grid-cols-3 gap-6 mb-6">
                <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Süt Döngü Analizi</h5>
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
                            <h5 className="font-semibold text-lg dark:text-white-light">Yavru Döngü Analizi</h5>
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
                            <h5 className="font-semibold text-lg dark:text-white-light">Süt Döngü Analizi</h5>
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

               


                    <div className="panel h-full w-full">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Top Selling Product</h5>
                        </div>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr className="border-b-0">
                                        <th className="ltr:rounded-l-md rtl:rounded-r-md">Product</th>
                                        <th>Price</th>
                                        <th>Discount</th>
                                        <th>Sold</th>
                                        <th className="ltr:rounded-r-md rtl:rounded-l-md">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                        <td className="min-w-[150px] text-black dark:text-white">
                                            <div className="flex">
                                                <img className="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/product-headphones.jpg" alt="avatar" />
                                                <p className="whitespace-nowrap">
                                                    Headphone
                                                    <span className="text-primary block text-xs">Digital</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td>$168.09</td>
                                        <td>$60.09</td>
                                        <td>170</td>
                                        <td>
                                            <Link className="text-danger flex items-center" to="/">
                                                <IconMultipleForwardRight className="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />
                                                Direct
                                            </Link>
                                        </td>
                                    </tr>
                                    <tr className="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                        <td className="text-black dark:text-white">
                                            <div className="flex">
                                                <img className="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/product-shoes.jpg" alt="avatar" />
                                                <p className="whitespace-nowrap">
                                                    Shoes <span className="text-warning block text-xs">Faishon</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td>$126.04</td>
                                        <td>$47.09</td>
                                        <td>130</td>
                                        <td>
                                            <Link className="text-success flex items-center" to="/">
                                                <IconMultipleForwardRight className="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />
                                                Google
                                            </Link>
                                        </td>
                                    </tr>
                                    <tr className="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                        <td className="text-black dark:text-white">
                                            <div className="flex">
                                                <img className="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/product-watch.jpg" alt="avatar" />
                                                <p className="whitespace-nowrap">
                                                    Watch <span className="text-danger block text-xs">Accessories</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td>$56.07</td>
                                        <td>$20.00</td>
                                        <td>66</td>
                                        <td>
                                            <Link className="text-warning flex items-center" to="/">
                                                <IconMultipleForwardRight className="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />
                                                Ads
                                            </Link>
                                        </td>
                                    </tr>
                                    <tr className="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                        <td className="text-black dark:text-white">
                                            <div className="flex">
                                                <img className="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/product-laptop.jpg" alt="avatar" />
                                                <p className="whitespace-nowrap">
                                                    Laptop <span className="text-primary block text-xs">Digital</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td>$110.00</td>
                                        <td>$33.00</td>
                                        <td>35</td>
                                        <td>
                                            <Link className="text-secondary flex items-center" to="/">
                                                <IconMultipleForwardRight className="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />
                                                Email
                                            </Link>
                                        </td>
                                    </tr>
                                    <tr className="text-white-dark hover:text-black dark:hover:text-white-light/90 group">
                                        <td className="text-black dark:text-white">
                                            <div className="flex">
                                                <img className="w-8 h-8 rounded-md ltr:mr-3 rtl:ml-3 object-cover" src="/assets/images/product-camera.jpg" alt="avatar" />
                                                <p className="whitespace-nowrap">
                                                    Camera <span className="text-primary block text-xs">Digital</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td>$56.07</td>
                                        <td>$26.04</td>
                                        <td>30</td>
                                        <td>
                                            <Link className="text-primary flex items-center" to="/">
                                                <IconMultipleForwardRight className="rtl:rotate-180 ltr:mr-1 rtl:ml-1" />
                                                Referral
                                            </Link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
       
    );
};

export default Index;

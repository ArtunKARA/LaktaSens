import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '/Users/esmg2/OneDrive/Masaüstü/LaktaSens/UI/LaktaSense/src/store/index';
import ReactApexChart from 'react-apexcharts';
import Dropdown from '/Users/esmg2/OneDrive/Masaüstü/LaktaSens/UI/LaktaSense/src/components/Dropdown';
import { setPageTitle } from '/Users/esmg2/OneDrive/Masaüstü/LaktaSens/UI/LaktaSense/src/store/themeConfigSlice';
import IconHorizontalDots from '/Users/esmg2/OneDrive/Masaüstü/LaktaSens/UI/LaktaSense/src/components/Icon/IconHorizontalDots';


const Index = () => {
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
                name: 'Nem Değerleri',
                data: [40.00, 40.05, 40.04, 40.05, 40.08, 40.07, 40.06, 40.00, 40.00, 40.05, 40.06, 40.07, 40.00, 40.05, 40.04, 40.05, 40.08, 40.07, 40.06, 40.00, 40.00, 40.05, 40.00, 40.05,],
            },
            {
                name: 'Sıcaklık Değerleri',
                data: [20.00, 20.05, 20.04, 20.05, 20.08, 21.07, 21.06, 21.00, 20.00, 20.05, 20.06, 20.07, 20.00, 21.05, 21.04, 22.05, 22.08, 21.07, 21.06, 21.00, 21.00, 20.05, 20.00, 20.05,],
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
            labels: ['01.00', '02.00', '03.00', '04.00', '05.00', '06.00', '07.00', '08.00','09.00', '10.00', '11.00', '12.00', '13.00', '14.00', '15.00', '16.00', '17.00', '18.00', '19.00', '20.00', '21.00', '22.00', '23.00', '00.00'],
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
              tickAmount: 24, // 24 saat için detaylı aralık
              labels: {
                  offsetX: isRtl ? 2 : 0,
                  offsetY: 7,
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
                        return value / 1 ;
                    },
                    offsetX: isRtl ? -40 : -10,
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
                strokeDashArray: 10,
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

   
   
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Ahır
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Nem - Sıcaklık</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="grid xl:grid-cols-3 gap-6 mb-6">
                    <div className="panel h-full xl:col-span-2">
                        <div className="flex items-center justify-between dark:text-white-light mb-5">
                            <h5 className="font-semibold text-lg">Nem - Sıcaklık</h5>
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 1]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}
                                >
                                    <ul>
                                        <li>
                                            <button type="button">Weekly</button>
                                        </li>
                                        <li>
                                            <button type="button">Monthly</button>
                                        </li>
                                        <li>
                                            <button type="button">Yearly</button>
                                        </li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        {/*
                        <p className="text-lg dark:text-white-light/90">
                            Total Profit <span className="text-primary ml-2">$10,840</span>
                        </p>*/}
                        <div className="relative">
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={revenueChart.series} options={revenueChart.options} type="area" height={325} />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Sıcaklık ve Nem Aralıkları</h5>
                        </div>
                         {/* Form container */}
        <form className="pt-5 grid  gap-6">
          <div>
          <label className="text-gray-700 font-semibold">
             10-20°C ve %50-70 nem: İdeal koşullar.
            </label>
          </div>
          <div>
          <label className="text-gray-700 font-semibold">
             20-30°C ve %50-70 nem: Normal ancak dikat edilmeli.
            </label>
          </div>
          <div>
          <label className="text-gray-700 font-semibold">
          30-35°C ve %60-80 nem: Sıcak, stres riski başlar.
            </label>
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
            35-40°C ve %70-90 nem: Ölümcül, yüksek risk.
            </label>
          </div>

        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Index;

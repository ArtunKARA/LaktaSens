import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store/index';
import ReactApexChart from 'react-apexcharts';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconHorizontalDots from '../../components/Icon/IconHorizontalDots';
import axios from 'axios';
import { downloadExcel } from 'react-export-table-to-excel';

const Index = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sales Admin'));
    });
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const [analiz, setAnaliz] = useState<{status: string; data: { zamanGrubu: string; ortalamaSicaklik: string; ortalamaNem: string; ortalamaGaz: string; }[]; }>({ status: 'success', data: [], });
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [loading] = useState(false);

    useEffect(() => {
        const fetchDatas = async () => {
          try {
            const response = await axios.post(
              '/apie/veri/ahirAnaliz',
              {
                FirmaID: userInfo.firmaID,
                timeFrame:"saatlik"
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            setAnaliz(response.data);
            console.log('Response datas:', response.data);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchDatas();
    }, []);

    async function sellect(timeFrame:String){
        try {
          const response = await axios.post(
            '/apie/veri/ahirAnaliz',
            {
              FirmaID: userInfo.firmaID,
              timeFrame: timeFrame
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          setAnaliz(response.data);
          console.log('Response datas:', response.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }

    //Revenue Chart
    const revenueChart: any = {
        series: [
            {
                name: 'Nem Değerleri',
                data: analiz.data.map(item => parseFloat(item.ortalamaNem).toFixed(2)),
            },
            {
                name: 'Sıcaklık Değerleri',
                data:  analiz.data.map(item => parseFloat(item.ortalamaSicaklik).toFixed(2)),
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
                        fillColor: '#1B55E2',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                    {
                        seriesIndex: 1,
                        fillColor: '#E7515A',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                ],
            },
            labels: analiz.data.map(item => item.zamanGrubu),
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
    const header = ['zamanGrubu', 'ortalamaSicaklik', 'ortalamaNem', 'ortalamaGaz'];
    function handleDownloadExcel() {
      const cleanData = analiz.data.map(item => [
          item.zamanGrubu, 
          parseFloat(item.ortalamaSicaklik).toFixed(2),
          parseFloat(item.ortalamaNem).toFixed(2),
          parseFloat(item.ortalamaGaz).toFixed(2),
      ]);
      downloadExcel({
          fileName: 'Ahır Analiz',
          sheet: 'Ahır Sensör Verileri',
          tablePayload: {
              header,
              body: cleanData,
          },
      });
  }
   
   
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
                                        <button type="button" onClick={e => sellect("saatlik")}>Saatlik</button>
                                        </li>
                                        <li>
                                        <button type="button" onClick={e => sellect("gunluk")}>Günlük</button>
                                        </li>
                                        <li>
                                        <button type="button" onClick={e => sellect("haftalik")}>Haftalık</button>
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
          <button type="button" className="btn btn-success btn-sm m-1" onClick={handleDownloadExcel}>EXCEL Olarak Verileri İndir</button>

        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Index;

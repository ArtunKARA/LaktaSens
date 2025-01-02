import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store/index';
import ReactApexChart from 'react-apexcharts';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconHorizontalDots from '../../components/Icon/IconHorizontalDots';
import { downloadExcel } from 'react-export-table-to-excel';
import axios from 'axios';

const Index = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Tasma Analiz'));
    });
    const [data, setData] = useState<{ status: string; message: string; sensorData: { Sicaklik?: string; } | null }>({ status: 'passive', message: '', sensorData: null });
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const [analiz, setAnaliz] = useState<{status: string; data: { zamanGrubu: string; ortalamaTasamaSicaklik: string; ortalamaFirmaSicaklik: string; ortalamaFirmaNem: string; }[]; }>({ status: 'success', data: [], });
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const location = useLocation();
    const { tasmaID } = location.state || {}

    const [loading] = useState(false);

    useEffect(() => {
        const fetchDatas = async () => {
          try {
            const response = await axios.post(
              '/apie/veri/tasmaAnaliz',
              {
                FirmaID: userInfo.firmaID,
                timeFrame:"saatlik",
                tasmaID :tasmaID
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
            '/apie/veri/tasmaAnaliz',
            {
              FirmaID: userInfo.firmaID,
              timeFrame: timeFrame,
              tasmaID :tasmaID
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
      useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.post(
              '/apie/veri/tasmaCanli',
              {
                FirmaID: userInfo.firmaID,
                tasmaID:tasmaID
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            setData(response.data);
            console.log('Response data:', response.data);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
    
        const interval = setInterval(fetchData, 1000);
    
        return () => clearInterval(interval);
      }, []);

    //Revenue Chart
    const revenueChart: any = {
        series: [
            {
                name: 'Nem Değerleri',
                data: analiz.data.map(item => {
                    const value = parseFloat(item.ortalamaFirmaNem);
                    return isNaN(value) ? null : value.toFixed(2);
                }),
            },
            {
                name: 'Sıcaklık Değerleri',
                data: analiz.data.map(item => {
                    const value = parseFloat(item.ortalamaFirmaSicaklik);
                    return isNaN(value) ? null : value.toFixed(2);
                }),
            },
            {
              name: 'Tasma Değerleri',
              data:  analiz.data.map(item => {
                const value = parseFloat(item.ortalamaTasamaSicaklik);
                return isNaN(value) ? null : value.toFixed(2);
            }),
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
            colors: isDark ? ['#2196F3', '#E7515A', '#32CD32'] : ['#1B55E2', '#E7515A', '#32CD32'],
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
                  offsetX: isRtl ? 3 : 0,
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

    const header = ['zamanGrubu', 'ortalamaTasamaSicaklik', 'ortalamaAhırSicaklik', 'ortalamaAhırNem'];
    function handleDownloadExcel() {
      const cleanData = analiz.data.map(item => [
          item.zamanGrubu, 
          parseFloat(item.ortalamaTasamaSicaklik).toFixed(3),
          parseFloat(item.ortalamaFirmaSicaklik).toFixed(3),
          parseFloat(item.ortalamaFirmaNem).toFixed(3),
      ]);
      downloadExcel({
          fileName: 'Tasma Ve Ahır Analiz',
          sheet: 'Tasma Ve Ahır Sensör Verileri',
          tablePayload: {
              header,
              body: cleanData,
          },
      });
  }
  const renderGauge = (value: number | null, label: string, tur: string) => {
        
    let barColor = "bg-info"; // Varsayılan renk
    let percentage;
    if (value !== null) {
        if(tur == "sicaklik"){
            const min = 0;
            const max = 60;
            percentage = value !== null ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;// Yüzdelik hesaplama
            if (value >= 38 && value < 39) {
                barColor = "bg-green-500"; // İdeal koşullar
              } else if (value >= 39 && value < 40) {
                barColor = "bg-yellow-500"; // Normal, dikkat edilmeli
              } else if (value >= 40 && value < 41) {
                barColor = "bg-orange-500"; // Stres riski
              } else if (value >= 41) {
                barColor = "bg-red-500"; // Ölümcül, yüksek risk
              }else{
                barColor = "bg-blue-500";
              }
        }else{
        percentage = value !== null ? Math.min(Math.max((value / 100) * 100, 0), 100) : 0; // Yüzdelik hesaplama
            if (percentage >= 50 && percentage < 65) {
                barColor = "bg-green-500"; // İdeal koşullar
              } else if (percentage >= 65 && percentage < 75) {
                barColor = "bg-orange-500"; // Stres riski
              } else if (percentage >= 75 ) {
                barColor = "bg-red-500"; // Ölümcül, yüksek risk
              }else{
                barColor = "bg-blue-500";
              }
        }
    }else{
        percentage = 100;
        barColor = "bg-gray-500";
    }
  
    return (
      <div className="mb-5 space-y-5 max-w-lg w-full">
        <div className="w-full h-4 bg-[#ebedf2] dark:bg-dark/40 rounded-full">
          <div
            className={`${barColor} h-4 rounded-full text-center text-white text-xs`}
            style={{ width: `${percentage}%` }}
          >
            {value !== null ? (tur == "sicaklik" ? `${value.toFixed(1)}°C`:`${value.toFixed(1)}%`  ) : 'OFFLINE'}
          </div>
        </div>
        <div className="text-center font-medium text-sm">{label}</div>
      </div>
    );
  };

  const temperature = data.status === 'active' ? parseFloat(data.sensorData?.Sicaklik || 'NaN') : null;
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Tasma
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Nem - Sıcaklık</span>
                </li>
            </ul>
            <div className="panel mt-6">
          
          {/* Form Section */}
      
            <form className="grid grid-cols-[20%_60%_20%] gap-5">
            <div className="flex md:items-center md:flex-row flex-col mb-5 gap-6">
              <h5 className="font-semibold text-lg dark:text-white-light">{tasmaID+' Numaralı Tasma'}</h5>
            </div>
                  {/* Temperature Sensor */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                    {renderGauge(temperature, 'Sıcaklık Sensörü',"sicaklik")}
                    
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                </div>
              </form>
          </div>
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
                            <h5 className="font-semibold text-lg dark:text-white-light">İnek Vücut Sıcaklığı Aralıkları</h5>
                        </div>
                         {/* Form container */}
        <form className="pt-5 grid  gap-6">
          <div>
          <label className="text-gray-700 font-semibold">
          38,0-39,0°C (İdeal): Normal vücut sıcaklığı, sağlıklı ve rahat inekler.


            </label>
          </div>
          <div>
          <label className="text-gray-700 font-semibold">
          39,0-40,0°C (Sıcak): Hafif yüksek sıcaklık, stres belirtileri gözlemlenebilir, su tüketimi artabilir.

            </label>
          </div>
          <div>
          <label className="text-gray-700 font-semibold">
          40,0-41,0°C (Yüksek): Aşırı sıcaklık, ineklerde stres, yem tüketiminde azalma, verim kaybı görülebilir.
         
            </label>
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
            41,0°C ve üzeri (Tehlikeli): Hayati risk, termal şok, acil müdahale gereklidir.
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

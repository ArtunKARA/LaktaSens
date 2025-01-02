import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../components/Icon/IconBell';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için ekledik
import axios from 'axios';
interface sensor {
    SensorAdi: string; Durum: string; SensorID: string; SonSicaklikVerisi: string;
}
const MultipleTables = () => {
  
    const { t } = useTranslation();
    const [data, setData] = useState<{ status: string; message: string; sensorData: { Sicaklik?: string; Nem?: string } | null }>({ status: 'passive', message: '', sensorData: null });
    const [rowData, setRowData] = useState<sensor[]>([]);    
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const navigate = useNavigate(); // Yönlendirme için kullanılıyor
    const handleEditAhirSensorDetay = () => {
        navigate('/cifci/AhirSensorDetay'); // Doğru rota ile yönlendir
      };
    const handleEditCowsTemperatureSensor = (id : any) => {
        navigate('/cifci/InekSensorDetay',{ state: { tasmaID: id } }); // Doğru rota ile yönlendir
    };
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Multiple Tables'));
    });
    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.post(
              '/apie/veri/ahirCanli',
              {
                FirmaID: userInfo.firmaID,
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
            useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.post('/apie/veri/tasmalar', { FirmaID: userInfo.firmaID });
                const formattedData = response.data.map((item: any) => ({
                    SensorID: item.SensorID,
                    SensorAdi: item.SensorAdi,
                    SonSicaklikVerisi: item.SonSicaklikVerisi || 'N/A',
                    Durum: item.Durum || 'Inactive',
                }));
                setRowData(formattedData);
                console.log(formattedData)
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
 
    }, []);
      const renderGauge = (value: number | null, label: string, tur: string) => {
        
        let barColor = "bg-info"; // Varsayılan renk
        let percentage;
        if (value !== null) {
            if(tur == "sicaklik"){
                const min = -10;
                const max = 50;
                percentage = value !== null ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;// Yüzdelik hesaplama
                if (value >= 10 && value < 20) {
                    barColor = "bg-green-500"; // İdeal koşullar
                  } else if (value >= 20 && value < 30) {
                    barColor = "bg-yellow-500"; // Normal, dikkat edilmeli
                  } else if (value >= 30 && value < 35) {
                    barColor = "bg-orange-500"; // Stres riski
                  } else if (value >= 35) {
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
      const humidity = data.status === 'active' ? parseFloat(data.sensorData?.Nem || 'NaN') : null;
    
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'SensorID'));
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'SensorID',
        direction: 'asc',
    });
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item) => {
                return (
                    item.SensorID.toLowerCase().includes(search.toLowerCase()) ||
                    item.SensorAdi.toLowerCase().includes(search.toLowerCase()) ||
                    item.Durum.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.SonSicaklikVerisi.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);


    const formatDate = (date: string | number | Date) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const randomColor = () => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        const random = Math.floor(Math.random() * color.length);
        return color[random];
    };

    const randomStatus = () => {
        const status = ['PAID', 'APPROVED', 'FAILED', 'CANCEL', 'SUCCESS', 'PENDING', 'COMPLETE'];
        const random = Math.floor(Math.random() * status.length);
        return status[random];
    };

    useEffect(() => {
        console.log('Initial Records:', initialRecords); // Sıralama sonrası tabloya gönderilen verileri kontrol edin
    }, [initialRecords]);

    useEffect(() => {
        console.log('Records Data (Paginated):', recordsData); // Tabloya yansıyacak son veriler
    }, [recordsData]);

    useEffect(() => {
        if (rowData.length > 0) {
            setInitialRecords(sortBy(rowData, 'SensorAdi'));
        }
    }, [rowData]);

    const statusColor = (durum : String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if(durum != "Aktif"){
            return color[3]
        }else{
            return color[2]
        }
    };
    return (
      <div>
          {/* Header Section */}
          <div className="panel mt-6">
          
              {/* Form Section */}
          
                <form className="grid grid-cols-[20%_60%_20%] gap-5">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-6">
                  <h5 className="font-semibold text-lg dark:text-white-light">{t('Barn Sensor Tracking')}</h5>
                </div>
                      {/* Temperature Sensor */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                        {renderGauge(temperature, t('Temperature Sensor'),"sicaklik")}
                        {renderGauge(humidity, t('Humidity Sensor'),"nem")}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                    <button
                            type="button"
                            className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300"
                            title={t('Edit')}
                            onClick={handleEditAhirSensorDetay }
                            >
                            <IconPencil className="text-gray-500" />
                    </button>
                    </div>
                  </form>
              </div>

              {/* Data Table Section */}
              <div className="datatables">
                  <DataTable
                      className="whitespace-nowrap table-hover"
                      records={initialRecords}
                      columns={[
                        {
                            accessor: 'SensorID',
                            title: t('Sensor ID'),
                            sortable: true,
                        },
                          {
                              accessor: 'SensorAdi',
                              title: t('Sensor Name'),
                              sortable: true,
                          },
                          {
                              accessor: 'SonSicaklikVerisi',
                              title: t('Sensor Data'),
                              sortable: true,
                          },
                          {
                            accessor: 'Durum',
                            title: t('Status'),
                            sortable: true,
                            render: ({ Durum }) => <span className={`badge bg-${statusColor(Durum)}`}>{Durum}</span>,
                        },
                          {
                              accessor: 'Sensor Analizleri',
                              title: t('Sensor Analyzes'),
                              titleClassName: '!text-center',
                              render: ({ SensorID }) => (
                                  <div className="flex items-center w-max mx-auto gap-2">
                                      <Tippy content="Edit">
                                          <button type="button" onClick={() =>handleEditCowsTemperatureSensor(SensorID)}>
                                              <IconPencil />
                                          </button>
                                      </Tippy>
                                  </div>
                              ),
                          },
                      ]}
                      totalRecords={initialRecords.length}
                      recordsPerPage={pageSize}
                      page={page}
                      onPageChange={(p) => setPage(p)}
                      recordsPerPageOptions={[10, 20, 30, 50, 100]}
                      onRecordsPerPageChange={setPageSize}
                      sortStatus={sortStatus}
                      onSortStatusChange={setSortStatus}
                      minHeight={200}
                      paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                  />
              </div>
          </div>
      
    
  );
};


export default MultipleTables;

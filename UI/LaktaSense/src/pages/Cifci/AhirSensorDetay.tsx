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

const rowData = [
    {
        id: 1,
        firstName: 'Caroline',
        lastName: 'Jensen',
        sensorData: 'Temperature: 22°C',
        status: 'active',
      },
      {
        id: 2,
        firstName: 'Celeste',
        lastName: 'Grant',
        sensorData: 'Humidity: 45%',
        status: 'inactive',
      },
      {
        id: 3,
        firstName: 'Tillman',
        lastName: 'Forbes',
        sensorData: 'Temperature: 18°C',
        status: 'inactive',
      },
      {
        id: 4,
        firstName: 'Daisy',
        lastName: 'Whitley',
        sensorData: 'Pressure: 1020 hPa',
        status: 'active',
      },
      {
        id: 5,
        firstName: 'Weber',
        lastName: 'Bowman',
        sensorData: 'Humidity: 60%',
        status: 'inactive',
      },
      {
        id: 6,
        firstName: 'Buckley',
        lastName: 'Townsend',
        sensorData: 'Temperature: 25°C',
        status: 'active',
      },
      {
        id: 7,
        firstName: 'Latoya',
        lastName: 'Bradshaw',
        sensorData: 'Pressure: 1015 hPa',
        status: 'active',
      },
      {
        id: 8,
        firstName: 'Kate',
        lastName: 'Lindsay',
        sensorData: 'Temperature: 20°C',
        status: 'active',
      },
      {
        id: 9,
        firstName: 'Marva',
        lastName: 'Sandoval',
        sensorData: 'Humidity: 50%',
        status: 'inactive',
      },
      {
        id: 10,
        firstName: 'Decker',
        lastName: 'Russell',
        sensorData: 'Pressure: 1018 hPa',
        status: 'inactive',
      },
];

const MultipleTables = () => {
  
    const { t } = useTranslation();
    const navigate = useNavigate(); // Yönlendirme için kullanılıyor
    const handleEditNemSensorTakip = () => {
        navigate('/cifci/NemSensorTakip'); // Doğru rota ile yönlendir
      };
      const handleEditCowsTemperatureSensor = () => {
        navigate('/cifci/NemSensorTakip'); // Doğru rota ile yönlendir
    };
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Multiple Tables'));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'firstName'));
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
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
                    item.firstName.toLowerCase().includes(search.toLowerCase()) ||
                    item.lastName.toLowerCase().includes(search.toLowerCase()) ||
                    item.id.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.sensorData.toLowerCase().includes(search.toLowerCase()) ||
                    item.status.toLowerCase().includes(search.toLowerCase()) 
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

    const [page2, setPage2] = useState(1);
    const [pageSize2, setPageSize2] = useState(PAGE_SIZES[0]);
    const [initialRecords2, setInitialRecords2] = useState(sortBy(rowData, 'firstName'));
    const [recordsData2, setRecordsData2] = useState(initialRecords2);

    const [search2, setSearch2] = useState('');
    const [sortStatus2, setSortStatus2] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });

    useEffect(() => {
        setPage2(1);
    }, [pageSize2]);

    useEffect(() => {
        const from = (page2 - 1) * pageSize2;
        const to = from + pageSize2;
        setRecordsData2([...initialRecords2.slice(from, to)]);
    }, [page2, pageSize2, initialRecords2]);

    useEffect(() => {
        setInitialRecords2(() => {
            return rowData.filter((item: any) => {
                return (
                    item.firstName.toLowerCase().includes(search.toLowerCase()) ||
                    item.lastName.toLowerCase().includes(search.toLowerCase()) ||
                    item.id.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.sensorData.toLowerCase().includes(search.toLowerCase()) ||
                    item.status.toLowerCase().includes(search.toLowerCase()) 
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search2]);

    useEffect(() => {
        const data2 = sortBy(initialRecords2, sortStatus2.columnAccessor);
        setInitialRecords2(sortStatus2.direction === 'desc' ? data2.reverse() : data2);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus2]);

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

    

    return (
      <div>
          {/* Header Section */}
          <div className="panel mt-6">
          
              {/* Form Section */}
          
                  <form className="grid grid-cols-3 gap-6">
                  <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                  <h5 className="font-semibold text-lg dark:text-white-light">{t('Barn Sensor Tracking')}</h5>
              </div>
                      {/* Temperature Sensor */}
                      <div className="relative">
                          <label htmlFor="temperatureSensor" className="block font-semibold mb-1">
                              {t('Temperature Sensor')}
                          </label>
                          <input id="temperatureSensor" type="text" className="form-input w-full" />
                      </div>


                      {/* Cows Body Temperature */}
                      <div className="relative">
                          <label htmlFor="humiditySensor" className="block font-semibold mb-1">
                              {t('Humidity Sensor')}
                          </label>
                          <div className="flex items-center">
                              <input id="humiditySensor" type="text" className="form-input w-full" />
                              <button
                                  type="button"
                                  className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300"
                                  title={t('Edit')}
                                  onClick={handleEditCowsTemperatureSensor}
                              >
                                  <IconPencil className="text-gray-500" />
                              </button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
  );
};


export default MultipleTables;

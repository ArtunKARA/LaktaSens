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
import { useNavigate } from 'react-router-dom';

interface CowData {
    İnekID: string;
    İnekAdı: string;
    Irkı: string;
    Yaşı: number;
    Kilosu: number;
    SütDöngüsüDurumu: string;
    SütKalanGünSayısı: number;
    SütKalanGünDurumu: string;
    YavruDöngüsüDurumu: string;
    YavruKalanGünSayısı: number;
    YavruKalanGünDurumu: string;
}

const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<CowData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/genelTakip/genelTakip', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ID:userInfo.kullaniciID}), // Kullanıcı ID'sini gönderiyorsunuz
            });
            const data = await response.json();
            console.log('Gelen veri:', data);
            setRowData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
          } catch (error) {
            console.error('API çağrısı sırasında bir hata oluştu:', error);
          }
        };
    
        fetchData();
      }, []); // Boş bağımlılık dizisi, component mount olduğunda sadece bir kez çalıştırılır


    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('General Follow Up')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<CowData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'inekID');
        setInitialRecords(sortedData);
    }, [rowData]);
    
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'inekID',
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
                    item.İnekID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.İnekAdı.toLowerCase().includes(search.toLowerCase()) ||
                    item.Irkı.toLowerCase().includes(search.toLowerCase()) ||
                    item.Yaşı.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.Kilosu.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.SütDöngüsüDurumu.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.SütKalanGünSayısı.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.SütKalanGünDurumu.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.YavruDöngüsüDurumu.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.YavruKalanGünSayısı.toString().toLowerCase().includes(search.toLowerCase())
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

    const statusColor = (durum : String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        switch (durum) {
            case "Sagimda":
                return "#28a745"
                break;
            case "Kuruda":
                return "#007bff"
                break;
            case "Bilinmiyor":
                return "#6c757d"
                break;
            case "Gebe":
                return "#28a745"
                break;
            case "Serviste":
                return "#ffc107"
                break;
            case "Cikarilmali":
                return "#dc3545"
                break;
            case "Kontrol Edilmeli":
                return "#dc3545"
                break;
            case "Normal":
                return "#28a745"
                break;                
            default:
                return ""
                break;
        }
    };
    const navigate = useNavigate();
    const handleDetailClick = (id : any) => {
        navigate('/cifci/GenelTakipDetay', { state: { cowID: id } });
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('General Follow Up')}</h5>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            {
                                accessor: 'İnekID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'İnekAdı',
                                title: t('Name'),
                                sortable: true
                            },
                            {
                                accessor: 'Irkı',
                                title: t('Breed'),
                                sortable: true,
                            },
                            { 
                                accessor: 'Yaşı',
                                title: t('Age'), 
                                sortable: true 
                            },
                            {
                                accessor: 'Kilosu',
                                title: t('Weigth'),
                                sortable: true,
                            },
                           
                            {
                                accessor: 'SütDöngüsüDurumu',
                                title: t('Milk Cycle'),
                                sortable: true,
                            },
                            {
                                accessor: 'SütKalanGünSayısı',
                                title: t('MD Remaining Days'),
                                sortable: true,
                            },
                            {
                                accessor: 'SütKalanGünDurumu',
                                title: t('MD Status'),
                                sortable: true,
                                render: ({SütKalanGünDurumu}) => <span className={`badge bg-primary`}  
                                style={{ 
                                    backgroundColor: statusColor(SütKalanGünDurumu),
                                    color: 'white'
                                }}>{SütKalanGünDurumu}</span>,                            
                            },
                            {
                                accessor: 'YavruDöngüsüDurumu',
                                title: t('Calving Cycle'),
                                sortable: true,
                            },
                            {
                                accessor: 'YavruKalanGünSayısı',
                                title: t('CD Remaining Days'),
                                sortable: true,
                            },
                            {
                                accessor: 'YavruKalanGünDurumu',
                                title: t('CD Status'),
                                sortable: true,
                                render: ({YavruKalanGünDurumu}) => <span className={`badge bg-primary`}  
                                style={{ 
                                    backgroundColor: statusColor(YavruKalanGünDurumu),
                                    color: 'white'
                                }}>{YavruKalanGünDurumu}</span>,
                            },
                            {
                                accessor: 'Detay',
                                title: t('Detail'),
                                titleClassName: '!text-center',
                                render: ({ İnekID }) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Edit">
                                            <button type="button" onClick={() => handleDetailClick(İnekID)}>
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
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MultipleTables;

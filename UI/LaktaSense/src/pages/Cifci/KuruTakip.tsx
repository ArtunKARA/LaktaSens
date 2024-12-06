import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../components/Icon/IconBell';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';

interface CowData {
    İnekID: string;
    ad: string;
    irk: string;
    durum: string;
    kalanGun: number;
}

const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<CowData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/kuru/postKuru', {
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
    const [page2, setPage2] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize2, setPageSize2] = useState(PAGE_SIZES[0]);
    const [initialRecords2, setInitialRecords2] = useState(sortBy(rowData, 'firstName'));
    const [recordsData2, setRecordsData2] = useState(initialRecords2);
    const [search2, setSearch2] = useState('');
    const [sortStatus2, setSortStatus2] = useState<DataTableSortStatus>({
    columnAccessor: 'firstName',
    direction: 'asc',
  });
  const [modal21, setModal21] = useState(false);

  useEffect(() => {
    const from = (page2 - 1) * pageSize2;
    const to = from + pageSize2;
    setRecordsData2([...initialRecords2.slice(from, to)]);
  }, [page2, pageSize2, initialRecords2]);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('Dry')));
    });
    const [page, setPage] = useState(1);
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
                    item.ad.toLowerCase().includes(search.toLowerCase()) ||
                    item.durum.toLowerCase().includes(search.toLowerCase()) ||
                    item.irk.toLowerCase().includes(search.toLowerCase()) ||
                    item.kalanGun.toString().toLowerCase().includes(search.toLowerCase())
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
        if(durum != "Kuruda"){
            return color[3]
        }else{
            return color[2]
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Dry')}</h5>
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
                                accessor: 'inekID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'ad',
                                title: t('Name'),
                                sortable: true
                            },
                            {
                                accessor: 'irk',
                                title: t('Breed'),
                                sortable: true,
                            },
                            {
                                accessor: 'kalanGun',
                                title: t('Number of Days Remaining'),
                                sortable: true,
                            },
                           
                            {
                                accessor: 'durum',
                                title: t('Status'),
                                sortable: true,
                                render: ({ durum }) => <span className={`badge bg-${statusColor(durum)}`}>{durum}</span>,
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

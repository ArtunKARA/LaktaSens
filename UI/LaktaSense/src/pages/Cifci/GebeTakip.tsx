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


interface CowData {
    inekID: string;
    ad: string;
    irk: string;
    guncelGunSayisi: string;
    durum: string;
}

const MultipleTables = () => {
    const [rowData, setRowData] = useState<CowData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/gebe/postAllGebe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id: "1" }), // Kullanıcı ID'sini gönderiyorsunuz
            });
            const data = await response.json();
            
            // Veriyi rowData state'ine kaydedin
            setRowData(await data);
          } catch (error) {
            console.error('API çağrısı sırasında bir hata oluştu:', error);
          }
        };
    
        fetchData();
      }, []); // Boş bağımlılık dizisi, component mount olduğunda sadece bir kez çalıştırılır


    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('Pregnant')));
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
                    item.inekID.toLowerCase().includes(search.toLowerCase()) ||
                    item.ad.toLowerCase().includes(search.toLowerCase()) ||
                    item.irk.toLowerCase().includes(search.toLowerCase()) ||
                    item.guncelGunSayisi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.durum.toLowerCase().includes(search.toLowerCase())
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
    const [initialRecords2, setInitialRecords2] = useState(sortBy(rowData, 'inekID'));
    const [recordsData2, setRecordsData2] = useState(initialRecords2);

    const [search2, setSearch2] = useState('');
    const [sortStatus2, setSortStatus2] = useState<DataTableSortStatus>({
        columnAccessor: 'inekID',
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
                    item.inekID.toLowerCase().includes(search.toLowerCase()) ||
                    item.ad.toLowerCase().includes(search.toLowerCase()) ||
                    item.irk.toLowerCase().includes(search.toLowerCase()) ||
                    item.guncelGunSayisi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.durum.toLowerCase().includes(search.toLowerCase())
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
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Pregnant')}</h5>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search2} onChange={(e) => setSearch2(e.target.value)} />
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData2}
                        columns={[
                            { 
                                accessor: 'inekID',
                                title: t('ID'), 
                                sortable: true 
                            },
                            {
                                accessor: 'ad',
                                title: t('Name'),
                                sortable: true,
                            },
                            {
                                accessor: 'irk',
                                title: t('Breed'),
                                sortable: true,
                            },
                            {
                                accessor: 'guncelGunSayisi',
                                title: t('Number of Days Remaining'),
                                sortable: true,
                            },
                           
                            {
                                accessor: 'durum',
                                title: t('Status'),
                                sortable: true,
                                render: () => <span className={`badge bg-${randomColor()} `}>{randomStatus()}</span>,
                            },
                            {
                                accessor: 'Yavru Ekle',
                                title: t('Add Calf'),
                                titleClassName: '!text-center',
                                render: () => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Edit">
                                            <button type="button">
                                                <IconPencil />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Delete">
                                            <button type="button">
                                                <IconTrashLines />
                                            </button>
                                        </Tippy>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords2.length}
                        recordsPerPage={pageSize2}
                        page={page2}
                        onPageChange={(p) => setPage2(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize2}
                        sortStatus={sortStatus2}
                        onSortStatusChange={setSortStatus2}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MultipleTables;

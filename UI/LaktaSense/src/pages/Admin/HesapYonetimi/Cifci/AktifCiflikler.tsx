import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../../../components/Icon/IconBell';
import IconXCircle from '../../../../components/Icon/IconXCircle';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../../components/Icon/IconX';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toNumber } from 'lodash';
import IconPlus from '../../../../components/Icon/IconPlus';
import Swal from 'sweetalert2';
import IconMenu from '../../../../components/Icon/IconMenu';

interface CompanyData {
    CompanyID: string;
    CompanyName: string;
    CompanyPhone: string;
    CompanyMail: string;
    CompanyCity: string;
    CompanyDistrict: string;
}


const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<CompanyData[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/adminFirmalar/getAktifCiflikler', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
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
        dispatch(setPageTitle(t('Active Farms')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<CompanyData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'CompanyID');
        setInitialRecords(sortedData);
    }, [rowData]);
    
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modal21, setModal21] = useState(false);
    const [modalAcceptCheck, setModalAcceptCheck] = useState(false);
    const [modal22, setModal22] = useState(false);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'CompanyID',
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
                    item.CompanyID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyName.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyPhone.toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyMail.toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyCity.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyDistrict.toString().toLowerCase().includes(search.toLowerCase())
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

    const navigate = useNavigate();
    
    const Details = (CompanyID : string) => {
      navigate('/admin/CiflikDetay', { state: { CompanyID: CompanyID } });
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Active Farms')}</h5>
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
                                accessor: 'CompanyID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'CompanyName',
                                title: t('Farm Name'),
                                sortable: true
                            },
                            {
                                accessor: 'CompanyPhone',
                                title: t('Telephone'),
                                sortable: true,
                            },
                            { 
                                accessor: 'CompanyMail',
                                title: t('Email'), 
                                sortable: true
                            },
                            {
                                accessor: 'CompanyCity',
                                title: t('City'),
                                sortable: true,
                            },
                            {
                                accessor: 'CompanyDistrict',
                                title: t('District'),
                                sortable: true,
                            },
                            {
                                accessor: 'Detail',
                                title: t('Detail'),
                                render: ({CompanyID}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Details">
                                            <button type="button"
                                            onClick={() => {
                                              Details(CompanyID)
                                              }}>
                                                <IconMenu />
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

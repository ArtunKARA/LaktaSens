import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import IconBell from '../../../../components/Icon/IconBell';
import IconXCircle from '../../../../components/Icon/IconXCircle';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../../components/Icon/IconX';
import ReactApexChart from 'react-apexcharts';
import { IRootState } from '../../../../store';
import { useNavigate } from 'react-router-dom';

interface FeedData {
    depoID: string;
    firmaID: string;
    yemID: string;
    yemAdi: string;
    miktarKg: number;
    sonGuncellemeTarihi: number;
}

const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<FeedData[]>([]);
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postStokListesi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }), // Kullanıcı ID'sini gönderiyorsunuz
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
    const [initialRecords2, setInitialRecords2] = useState(sortBy(rowData, 'yemAdi'));
    const [recordsData2, setRecordsData2] = useState(initialRecords2);
    const [search2, setSearch2] = useState('');
    const [sortStatus2, setSortStatus2] = useState<DataTableSortStatus>({
        columnAccessor: 'yemAdi',
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
        dispatch(setPageTitle(t('Stock')));
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<FeedData[]>([]);
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
                    item.depoID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.firmaID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.yemID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.yemAdi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.miktarKg.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.sonGuncellemeTarihi.toString().toLowerCase().includes(search.toLowerCase())
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

    const statusColor = (durum: String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if (durum != 'Kuruda') {
            return color[3];
        } else {
            return color[2];
        }
    };
    const [loading] = useState(false);
    const pieChartDagilim: any = {
        series: rowData.map((item) => item.miktarKg),
        options: {
            chart: {
                height: 300,
                type: 'pie',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            labels: rowData.map((item) => item.yemAdi),
            colors: rowData.map(
                () =>
                    `#${Math.floor(Math.random() * 16777215)
                        .toString(16)
                        .padStart(6, '0')}`
            ),
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200,
                        },
                    },
                },
            ],
            stroke: {
                show: false,
            },
            legend: {
                position: 'bottom',
            },
        },
    };

    const barChartStok: any = {
        series: [
            {
                name: t('Stock'),
                data: rowData.map((item) => item.miktarKg),
            },
        ],
        options: {
            chart: {
                height: 300,
                type: 'bar',
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
                width: 1,
            },
            colors: ['#4361ee'],
            xaxis: {
                categories: rowData.map((item) => item.yemAdi),
                axisBorder: {
                    color: true ? '#191e3a' : '#e0e6ed',
                },
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },
            },
            fill: {
                opacity: 0.8,
            },
        },
    };
    const navigate = useNavigate();
    const handleDetailClick = (yemID: any) => {
        navigate('/cifci/yemDetay', { state: { yemID: yemID } });
    };

    return (
        <div>
            <div className="pt-5">
                <div className="grid xl:grid-cols-3 gap-6 mb-6">
                    <div className="panel h-full col-span-2">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Feed Stock')}</h5>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={barChartStok.series} options={barChartStok.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="bar" height={300} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Distribution Ratio')}</h5>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart
                                        series={pieChartDagilim.series}
                                        options={pieChartDagilim.options}
                                        className="rounded-lg bg-white dark:bg-black overflow-hidden"
                                        type="pie"
                                        height={300}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Stock')}</h5>
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
                                accessor: 'depoID',
                                title: t('ID'),
                                sortable: true,
                            },
                            {
                                accessor: 'yemAdi',
                                title: t('Feed Name'),
                                sortable: true,
                            },
                            {
                                accessor: 'miktarKg',
                                title: t('Amount (Kg)'),
                                sortable: true,
                            },
                            {
                                accessor: 'sonGuncellemeTarihi',
                                title: t('Last Update Date'),
                                sortable: true,
                            },
                            {
                                accessor: 'Detail',
                                title: t('Detail'),
                                titleClassName: '!text-center',
                                render: ({ yemID }) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content={t('Detail')}>
                                            <button type="button" onClick={() => handleDetailClick(yemID)}>
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

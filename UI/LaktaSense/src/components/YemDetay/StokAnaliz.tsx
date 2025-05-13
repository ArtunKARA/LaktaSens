import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';

interface StokAnalizProps {
    yemID: string;
    firmaID?: number;
}

interface IslemNedeniData {
    islemNedeniID: number;
    nedenAdi: string;
    islemTipi: string;
}

interface FeedData {
    logID: string;
    firmaID: string;
    firmaAdi: string;
    yemID: string;
    yemAdi: string;
    miktarKg: string;
    islemTarihi: string;
    aciklama: string;
    nedenAdi: string;
    islemNedeniID: number;
    kullaniciAdi: string;
}

interface FeedStockMovement {
    yemAdi: string;
    zamanGrubu: string;
    tuketimKg: number;
    cikisKg: number;
    girisKg: number;
    depoStok: number;
}

const StokAnaliz: React.FC<StokAnalizProps> = ({ yemID, firmaID }) => {
    const [islemTipleri, setIslemTipleri] = useState<IslemNedeniData[]>([]);
    const [filterAccepted, setFilterAccepted] = useState<number[]>(islemTipleri.map((item) => item.islemNedeniID));
    const [filterAcceptedDistributionRatio, setFilterAcceptedDistributionRatio] = useState<any[]>(islemTipleri.map((item) => item.islemNedeniID));
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<FeedData[]>([]);
    const [rowData, setRowData] = useState<FeedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'yillik' | 'haftalik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postIslemNedenleri', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setIslemTipleri(data); // Gelen veriyi state'e atıyoruz
                const initialFilterAcceptedLog = data.map((item: IslemNedeniData) => item.islemNedeniID);
                setFilterAcceptedLog(initialFilterAcceptedLog); // Başlangıçta tüm filtreleri seçili yapıyoruz
                setFilterAccepted(initialFilterAcceptedLog); // Başlangıçta tüm filtreleri seçili yapıyoruz
                setFilterAcceptedDistributionRatio(initialFilterAcceptedLog); // Başlangıçta tüm filtreleri seçili yapıyoruz
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);
    const [stockMovement, setStockMovement] = useState<FeedStockMovement[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postCiflikYemDepoAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: firmaID, yemID: yemID, zamanTipi: zamanTipi }),
                });
                const data = await response.json();
                setStockMovement(data);
                setLoading(false);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipi]);

    const mixedChart: any = {
        series: [
            {
                name: t('Warehouse Stock'),
                type: 'area',
                data: stockMovement.length > 0 ? stockMovement.slice(0, -1).map((d) => d.depoStok) : [0],
            },
            {
                name: t('Consumption'),
                type: 'line',
                data: stockMovement.length > 0 ? stockMovement.slice(0, -1).map((d) => d.tuketimKg) : [0],
            },
            {
                name: t('Dispatch'),
                type: 'line',
                data: stockMovement.length > 0 ? stockMovement.slice(0, -1).map((d) => d.cikisKg) : [0],
            },
            {
                name: t('Goods Receipt'),
                type: 'line',
                data: stockMovement.length > 0 ? stockMovement.slice(0, -1).map((d) => d.girisKg) : [0],
            },
        ],
        options: {
            chart: {
                id: 'consumption-mixed',
                type: 'line',
                height: 300,
                zoom: { enabled: false },
                toolbar: { show: false },
            },
            dataLabels: {
                enabled: false,
            },
            colors: ['#00ab55', '#4361ee', '#ff6f61', '#ffc107'],
            stroke: {
                width: [2, 2],
                curve: 'smooth',
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            fill: {
                opacity: [0.25, 1],
            },
            labels: stockMovement.length > 0 ? stockMovement.slice(0, -1).map((item) => item.zamanGrubu) : [0],
            markers: {
                size: 0,
            },
            xaxis: {
                type: 'string',
                axisBorder: {
                    color: isDark ? '#191e3a' : '#e0e6ed',
                },
            },
            yaxis: {
                title: {
                    text: t('Consumption (kg)'),
                },
                min: 0,
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
            },
            tooltip: {
                shared: true,
                intersect: false,
                theme: isDark ? 'dark' : 'light',
            },
            legend: {
                itemMargin: {
                    horizontal: 4,
                    vertical: 8,
                },
            },
        },
    };

    useEffect(() => {
        const sortedData = sortBy(rowData, 'logID');
        setInitialRecords(sortedData);
    }, [rowData]);

    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'logID',
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
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);
    const [filterAcceptedLog, setFilterAcceptedLog] = useState<any[]>([]);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postCiflikYemDepoGecmisi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: firmaID, yemID: yemID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRowData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);
    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item) => {
                if (filterAcceptedLog.includes(item.islemNedeniID)) {
                    return item; // Filtreye uyan verileri göster
                }
            });
        });
    }, [filterAcceptedLog]);
    return (
        <div>
            <div className="panel h-full p-0 lg:col-span-1">
                <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                    <h5 className="font-semibold text-lg ">{t('Stock Movements')}</h5>
                    <div className="dropdown">
                        <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                            <ul>
                                <li>
                                    <button type="button" onClick={() => setzamanTipi('haftalik')}>
                                        {t('Weekly')}
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => setzamanTipi('aylik')}>
                                        {t('Monthly')}
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => setzamanTipi('yillik')}>
                                        {t('Yearly')}
                                    </button>
                                </li>
                            </ul>
                        </Dropdown>
                    </div>
                </div>

                {loading ? (
                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                    </div>
                ) : (
                    <ReactApexChart series={mixedChart.series} options={mixedChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="line" height={300} />
                )}
            </div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Movement Logs')}</h5>
                    <div className="flex items-center gap-5 ltr:ml-auto rtl:mr-auto">
                        <div className="flex md:items-center md:flex-row flex-col gap-5">
                            <div className="dropdown">
                                <Dropdown
                                    btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                    button={
                                        <>
                                            <span className="ltr:mr-1 rtl:ml-1">{t('Movement Type')}</span>
                                            <IconCaretDown className="w-5 h-5" />
                                        </>
                                    }
                                >
                                    <ul className="!min-w-[200px]">
                                        {' '}
                                        {/* Dropdown width increased */}
                                        {islemTipleri.map((col, i) => {
                                            return (
                                                <li
                                                    key={i}
                                                    className="flex flex-col"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <div className="flex items-center px-4 py-1">
                                                        <label className="cursor-pointer mb-0">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox"
                                                                defaultValue={col.islemNedeniID}
                                                                checked={filterAcceptedLog.includes(col.islemNedeniID)}
                                                                onChange={(event: any) => {
                                                                    const isChecked = event.target.checked;
                                                                    setFilterAcceptedLog((prev: any) =>
                                                                        isChecked ? [...prev, col.islemNedeniID] : prev.filter((id: number) => id !== col.islemNedeniID)
                                                                    );
                                                                }}
                                                            />
                                                            <span className="ltr:ml-2 rtl:mr-2">{col.nedenAdi}</span>
                                                        </label>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="text-right">
                            <input type="text" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            {
                                accessor: 'logID',
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
                                accessor: 'islemTarihi',
                                title: t('Operation Date'),
                                sortable: true,
                            },
                            {
                                accessor: 'nedenAdi',
                                title: t('Reson'),
                                sortable: true,
                            },
                            {
                                accessor: 'aciklama',
                                title: t('Explaination'),
                                sortable: true,
                            },
                            {
                                accessor: 'kullaniciAdi',
                                title: t('User'),
                                sortable: true,
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

export default StokAnaliz;

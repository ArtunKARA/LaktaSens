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
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../../../components/Dropdown';
import IconHorizontalDots from '../../../../components/Icon/IconHorizontalDots';
import IconPlus from '../../../../components/Icon/IconPlus';
import IconMail from '../../../../components/Icon/IconMail';
import IconChecks from '../../../../components/Icon/IconChecks';
import IconServer from '../../../../components/Icon/IconServer';
import IconFile from '../../../../components/Icon/IconFile';
import { colors } from 'react-select/dist/declarations/src/theme';

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
    kullaniciAdi: string;
}

interface YemDepoTumUrunlerGecmisiAnaliz {
    yemID: number;
    yemAdi: string;
    durum: {
        zamanGrubu: string;
        depoStok: number;
    }[];
}

interface ZamanData {
    yemAdi: string;
    zamanGrubu: string;
    toplamTuketimKg: string;
}

interface ToplamTuketimData {
    yemAdi: string;
    toplamTuketimKg: string;
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
                const response = await fetch('http://localhost:3030/api/depo/postTuketimListesi', {
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

    const [timeData, setTimeData] = useState<ZamanData[]>([]);
    const [zamanTipi, setzamanTipi] = useState('aylik');
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postTuketimZamanliGrafik', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, zamanTipi: zamanTipi }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                setTimeData(data);
                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipi]);

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
        setInitialRecords(() => {
            return rowData.filter((item) => {
                return (
                    item.logID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.firmaID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.firmaAdi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.yemID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.yemAdi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.miktarKg.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.islemTarihi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.aciklama.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.nedenAdi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.kullaniciAdi.toString().toLowerCase().includes(search.toLowerCase())
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

    const navigate = useNavigate();
    const handleDetailClick = (yemID: any) => {
        navigate('/cifci/yemDetay', { state: { yemID: yemID } });
    };

    // 1. Yem bazlı gruplama yapacağız
    const yemMap = new Map<string, { [key: string]: number }>();

    timeData.forEach((item) => {
        if (!yemMap.has(item.yemAdi)) {
            yemMap.set(item.yemAdi, {});
        }
        yemMap.get(item.yemAdi)![item.zamanGrubu] = parseFloat(item.toplamTuketimKg);
    });

    // 2. Tüm zaman gruplarını (tarihleri) bulup sıraya dizelim
    const zamanGruplariSet = new Set<string>();
    timeData.forEach((item) => zamanGruplariSet.add(item.zamanGrubu));
    const zamanGruplari = Array.from(zamanGruplariSet).sort(); // sıralı olsun

    // 3. Series dizisini oluşturalım
    const series = Array.from(yemMap.entries()).map(([yemAdi, zamanVerileri]) => ({
        name: yemAdi,
        data: zamanGruplari.map((zaman) => zamanVerileri[zaman] ?? 0), // veri yoksa 0
    }));

    // 4. Final Chart Config
    const tuketimrSeries: any = {
        series,
        options: {
            chart: {
                height: 360,
                type: 'bar',
                fontFamily: 'Nunito, sans-serif',
                toolbar: { show: false },
            },
            dataLabels: { enabled: false },
            stroke: { width: 2, colors: ['transparent'] },
            colors: timeData.map(
                () =>
                    `#${Math.floor(Math.random() * 16777215)
                        .toString(16)
                        .padStart(6, '0')}`
            ),
            dropShadow: {
                enabled: true,
                blur: 3,
                color: '#515365',
                opacity: 0.4,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 8,
                    borderRadiusApplication: 'end',
                },
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                itemMargin: { horizontal: 8, vertical: 8 },
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
                padding: { left: 20, right: 20 },
                xaxis: { lines: { show: false } },
            },
            xaxis: {
                categories: zamanGruplari, // zamanlar burada dinamik
                axisBorder: {
                    show: true,
                    color: isDark ? '#3b3f5c' : '#e0e6ed',
                },
            },
            yaxis: { tickAmount: 6 },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: isDark ? 'dark' : 'light',
                    type: 'vertical',
                    shadeIntensity: 0.3,
                    inverseColors: false,
                    opacityFrom: 1,
                    opacityTo: 0.8,
                    stops: [0, 100],
                },
            },
            tooltip: { marker: { show: true } },
        },
    };

    const [dagilimData, setDagilimData] = useState<ToplamTuketimData[]>([]);
    const [zamanTipiDagilim, setzamanTipiDagilim] = useState('aylik');
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postTuketimToplamGrafik', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, zamanTipi: zamanTipiDagilim }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                setDagilimData(data);
                console.log('Gelen verid:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipiDagilim]);

    const pieChartDagilim: any = {
        series: dagilimData.length > 0 ? dagilimData?.map((item) => item.toplamTuketimKg) : [1],
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
            labels: dagilimData.length > 0 ? dagilimData.map((item) => item.yemAdi) : ['No Data'],
            colors:
                dagilimData.length > 0
                    ? dagilimData.map(
                          () =>
                              `#${Math.floor(Math.random() * 16777215)
                                  .toString(16)
                                  .padStart(6, '0')}`
                      )
                    : ['#e0e6ed'],
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
    const [zamanTipiDepo, setzamanTipiDepo] = useState('aylik');
    const [yemDepoTumUrunlerGecmisiAnaliz, setYemDepoTumUrunlerGecmisiAnaliz] = useState<YemDepoTumUrunlerGecmisiAnaliz[]>([]);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifciAnaliz/postCiflikYemDepoTumUrunlerGecmisiAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, zamanTipi: zamanTipiDepo }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                setYemDepoTumUrunlerGecmisiAnaliz(data);

                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [zamanTipiDepo]);

    const zamanGruplari2 = Array.from(new Set(yemDepoTumUrunlerGecmisiAnaliz.flatMap((i) => i.durum.map((d) => d.zamanGrubu)))).sort(); // ['2025-04', '2025-05', ...]

    const labels = zamanGruplari2;

    const mixedChart: any = {
        series: yemDepoTumUrunlerGecmisiAnaliz.map(({ yemAdi, durum }) => ({
            name: yemAdi,
            type: 'line',
            data: zamanGruplari.map((zg) => {
                const rec = durum.find((d) => d.zamanGrubu === zg);
                return rec ? rec.depoStok : null;
            }),
        })),
        options: {
            chart: { height: 300, zoom: { enabled: false }, toolbar: { show: false } },
            dataLabels: { enabled: false },
            stroke: { width: 2, curve: 'smooth' },
            markers: { size: 0 },
            xaxis: {
                type: 'string',
                categories: labels,
                axisBorder: { color: isDark ? '#191e3a' : '#e0e6ed' },
            },
            yaxis: {
                title: { text: t('Amount (kg)') },
                min: 0,
            },
            grid: { borderColor: isDark ? '#191e3a' : '#e0e6ed' },
            tooltip: { shared: true, intersect: false, theme: isDark ? 'dark' : 'light' },
            legend: { itemMargin: { horizontal: 4, vertical: 8 } },
        },
    };

    return (
        <div>
            <div className="pt-5">
                <div className="grid xl:grid-cols-1 gap-6 mb-6">
                    <div className="panel h-full">
                        <div className="flex items-center mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('Warehouse Stock Chart')}</h5>
                            <div className="dropdown align-items-center ml-auto">
                                <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                                    <ul>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('haftalik')}>
                                                {t('Weekly')}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('aylik')}>
                                                {t('Monthly')}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" onClick={() => setzamanTipiDepo('yillik')}>
                                                {t('Yearly')}
                                            </button>
                                        </li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={mixedChart.series} options={mixedChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="line" height={300} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                <div className="panel h-full p-0 lg:col-span-2">
                    <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                        <h5 className="font-semibold text-lg ">{t('Consumption Graph')}</h5>
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

                    <ReactApexChart options={tuketimrSeries.options} series={tuketimrSeries.series} type="bar" height={360} className="overflow-hidden" />
                </div>

                <div className="panel h-full">
                    <div className="flex items-start justify-between dark:text-white-light mb-5 -mx-5 p-5 pt-0 border-b  border-white-light dark:border-[#1b2e4b]">
                        <h5 className="font-semibold text-lg ">{t('Consumption Distribution Ratio')}</h5>
                        <div className="dropdown">
                            <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                                <ul>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipiDagilim('haftalik')}>
                                            {t('Weekly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipiDagilim('aylik')}>
                                            {t('Monthly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipiDagilim('yillik')}>
                                            {t('Yearly')}
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
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

            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Consumption Logs')}</h5>
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
                                title: t('Last Update Date'),
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

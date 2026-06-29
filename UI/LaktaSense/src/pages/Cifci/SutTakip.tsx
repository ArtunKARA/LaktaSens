import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useMemo, useState } from 'react';
import sortBy from 'lodash/sortBy';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

interface SutTakipRecord {
    olcumID: number;
    inekID: number;
    inekQR: string;
    ad: string;
    irk: string;
    makineID?: number;
    makineAd: string;
    sutMiktar: number;
    sagimTarihi: string;
    oncekiSutMiktar?: number;
    avgSut?: number;
    toplamSut?: number;
    olcumSayisi?: number;
}

interface DailyTotal {
    tarih: string;
    toplam: number;
}

interface CowTotal {
    inek: string;
    toplam: number;
}

const PAGE_SIZES = [10, 20, 30, 50, 100];

const toNumber = (value: any, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatDate = (value: string) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
};

const normalizeRecord = (item: any): SutTakipRecord => ({
    olcumID: toNumber(item.olcumID),
    inekID: toNumber(item.inekID),
    inekQR: item.inekQR || '',
    ad: item.ad || '-',
    irk: item.irk || '-',
    makineID: item.makineID ? toNumber(item.makineID) : undefined,
    makineAd: item.makineAd || 'Sağım sensörü',
    sutMiktar: toNumber(item.sutMiktar),
    sagimTarihi: item.sagimTarihi || '',
    oncekiSutMiktar: item.oncekiSutMiktar === null ? undefined : toNumber(item.oncekiSutMiktar),
    avgSut: item.avgSut === null ? undefined : toNumber(item.avgSut),
    toplamSut: item.toplamSut === null ? undefined : toNumber(item.toplamSut),
    olcumSayisi: item.olcumSayisi === null ? undefined : toNumber(item.olcumSayisi),
});

const SutTakip = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;

    const [rowData, setRowData] = useState<SutTakipRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'sagimTarihi',
        direction: 'desc',
    });

    useEffect(() => {
        dispatch(setPageTitle(t('Süt Takip')));
    });

    const fetchData = async () => {
        if (!userInfo?.kullaniciID) {
            setError('Kullanıcı bilgisi bulunamadı.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:3030/api/sagim/postSutTakip', {
                ID: userInfo.kullaniciID,
            });
            const data = Array.isArray(response.data) ? response.data : [];
            setRowData(data.map(normalizeRecord));
        } catch (fetchError) {
            console.error('Süt takip verisi alınamadı:', fetchError);
            setError('Süt takip verisi alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredRecords = useMemo(() => {
        const filtered = rowData.filter((item) => {
            const query = search.toLowerCase();
            return (
                item.olcumID.toString().includes(query) ||
                item.inekID.toString().includes(query) ||
                item.inekQR.toLowerCase().includes(query) ||
                item.ad.toLowerCase().includes(query) ||
                item.irk.toLowerCase().includes(query) ||
                item.makineAd.toLowerCase().includes(query) ||
                item.sutMiktar.toString().includes(query) ||
                formatDate(item.sagimTarihi).toLowerCase().includes(query)
            );
        });

        const sorted = sortBy(filtered, sortStatus.columnAccessor);
        return sortStatus.direction === 'desc' ? sorted.reverse() : sorted;
    }, [rowData, search, sortStatus]);

    const recordsData = useMemo(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        return filteredRecords.slice(from, to);
    }, [filteredRecords, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search]);

    const totalMilk = rowData.reduce((total, item) => total + item.sutMiktar, 0);
    const averageMilk = rowData.length ? totalMilk / rowData.length : 0;
    const lastRecord = rowData[0];
    const uniqueCowCount = new Set(rowData.map((item) => item.inekID)).size;
    const uniqueMachineCount = new Set(rowData.map((item) => item.makineID || item.makineAd)).size;

    const dailyTotals = useMemo<DailyTotal[]>(() => {
        const totals = rowData.reduce<Record<string, number>>((acc, item) => {
            const key = formatDate(item.sagimTarihi);
            acc[key] = (acc[key] || 0) + item.sutMiktar;
            return acc;
        }, {});

        return Object.entries(totals)
            .map(([tarih, toplam]) => ({ tarih, toplam: Number(toplam.toFixed(2)) }))
            .reverse()
            .slice(-14);
    }, [rowData]);

    const cowTotals = useMemo<CowTotal[]>(() => {
        const totals = rowData.reduce<Record<string, number>>((acc, item) => {
            const key = `${item.ad} (#${item.inekID})`;
            acc[key] = (acc[key] || 0) + item.sutMiktar;
            return acc;
        }, {});

        return Object.entries(totals)
            .map(([inek, toplam]) => ({ inek, toplam: Number(toplam.toFixed(2)) }))
            .sort((a, b) => b.toplam - a.toplam)
            .slice(0, 8);
    }, [rowData]);

    const trendChart: any = {
        series: [
            {
                name: t('Süt Miktarı'),
                data: dailyTotals.map((item) => item.toplam),
            },
        ],
        options: {
            chart: {
                height: 300,
                type: 'area',
                toolbar: { show: false },
            },
            colors: ['#4361ee'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            xaxis: {
                categories: dailyTotals.map((item) => item.tarih),
            },
            yaxis: {
                labels: {
                    formatter: (value: number) => `${value.toFixed(0)} L`,
                },
            },
            tooltip: {
                y: {
                    formatter: (value: number) => `${value.toFixed(2)} L`,
                },
            },
            grid: {
                borderColor: '#e0e6ed',
            },
        },
    };

    const cowChart: any = {
        series: [
            {
                name: t('Toplam Süt'),
                data: cowTotals.map((item) => item.toplam),
            },
        ],
        options: {
            chart: {
                height: 300,
                type: 'bar',
                toolbar: { show: false },
            },
            colors: ['#00ab55'],
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    horizontal: false,
                    columnWidth: '45%',
                },
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories: cowTotals.map((item) => item.inek),
                labels: {
                    rotate: -20,
                    trim: true,
                },
            },
            yaxis: {
                labels: {
                    formatter: (value: number) => `${value.toFixed(0)} L`,
                },
            },
            tooltip: {
                y: {
                    formatter: (value: number) => `${value.toFixed(2)} L`,
                },
            },
        },
    };

    const statusColor = (record: SutTakipRecord) => {
        if (!record.oncekiSutMiktar) {
            return 'info';
        }

        const diff = record.sutMiktar - record.oncekiSutMiktar;
        if (diff < -2) {
            return 'danger';
        }

        if (diff > 2) {
            return 'success';
        }

        return 'primary';
    };

    const statusLabel = (record: SutTakipRecord) => {
        if (!record.oncekiSutMiktar) {
            return 'İlk kayıt';
        }

        const diff = record.sutMiktar - record.oncekiSutMiktar;
        if (diff < -2) {
            return 'Düşüş';
        }

        if (diff > 2) {
            return 'Artış';
        }

        return 'Stabil';
    };

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div className="panel">
                    <div className="text-white-dark text-sm">{t('Toplam Süt')}</div>
                    <div className="text-2xl font-bold mt-2">{totalMilk.toFixed(1)} L</div>
                    <div className="text-xs text-success mt-2">{rowData.length} ölçüm kaydı</div>
                </div>
                <div className="panel">
                    <div className="text-white-dark text-sm">{t('Ortalama Ölçüm')}</div>
                    <div className="text-2xl font-bold mt-2">{averageMilk.toFixed(1)} L</div>
                    <div className="text-xs text-primary mt-2">İnek başı takip</div>
                </div>
                <div className="panel">
                    <div className="text-white-dark text-sm">{t('Takipteki İnek')}</div>
                    <div className="text-2xl font-bold mt-2">{uniqueCowCount}</div>
                    <div className="text-xs text-info mt-2">{uniqueMachineCount} sağım sensörü</div>
                </div>
                <div className="panel">
                    <div className="text-white-dark text-sm">{t('Son Ölçüm')}</div>
                    <div className="text-2xl font-bold mt-2">{lastRecord ? `${lastRecord.sutMiktar.toFixed(1)} L` : '-'}</div>
                    <div className="text-xs text-warning mt-2">{lastRecord ? `${lastRecord.ad} - ${formatDate(lastRecord.sagimTarihi)}` : 'Kayıt yok'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('Günlük Süt Trendi')}</h5>
                        <span className="badge bg-primary">{t('Son 14 gün')}</span>
                    </div>
                    <ReactApexChart series={trendChart.series} options={trendChart.options} type="area" height={300} />
                </div>
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('İnek Bazlı Toplam')}</h5>
                        <span className="badge bg-success">{t('Top 8')}</span>
                    </div>
                    <ReactApexChart series={cowChart.series} options={cowChart.options} type="bar" height={300} />
                </div>
            </div>

            <div className="panel">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <div>
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('Süt Takip')}</h5>
                        <p className="text-white-dark text-sm mt-1">Sensörden gelen ölçümler sutOlcum kayıtlarından otomatik listelenir.</p>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-3">
                        <button type="button" className="btn btn-primary" disabled={loading} onClick={fetchData}>
                            {loading ? t('Yükleniyor') : t('Yenile')}
                        </button>
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                {error ? <div className="mb-5 rounded border border-danger/30 bg-danger-light p-3 text-danger">{error}</div> : null}

                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            {
                                accessor: 'olcumID',
                                title: t('Ölçüm ID'),
                                sortable: true,
                            },
                            {
                                accessor: 'inekID',
                                title: t('İnek'),
                                sortable: true,
                                render: ({ inekID, ad, inekQR }) => (
                                    <div>
                                        <div className="font-semibold">{ad}</div>
                                        <div className="text-xs text-white-dark">#{inekID} {inekQR ? `- ${inekQR}` : ''}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'irk',
                                title: t('Irk'),
                                sortable: true,
                            },
                            {
                                accessor: 'sutMiktar',
                                title: t('Süt Miktarı'),
                                sortable: true,
                                render: ({ sutMiktar }) => <span className="font-semibold text-primary">{sutMiktar.toFixed(2)} L</span>,
                            },
                            {
                                accessor: 'avgSut',
                                title: t('7 Ölçüm Ort.'),
                                sortable: true,
                                render: ({ avgSut }) => <span>{avgSut ? `${avgSut.toFixed(2)} L` : '-'}</span>,
                            },
                            {
                                accessor: 'makineAd',
                                title: t('Sensör / Makine'),
                                sortable: true,
                            },
                            {
                                accessor: 'sagimTarihi',
                                title: t('Tarih'),
                                sortable: true,
                                render: ({ sagimTarihi }) => <span>{formatDate(sagimTarihi)}</span>,
                            },
                            {
                                accessor: 'durum',
                                title: t('Durum'),
                                render: (record) => <span className={`badge bg-${statusColor(record)}`}>{statusLabel(record)}</span>,
                            },
                        ]}
                        totalRecords={filteredRecords.length}
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

export default SutTakip;

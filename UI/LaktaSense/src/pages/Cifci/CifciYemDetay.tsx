import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isEmpty, isSet, set, toNumber } from 'lodash';
import IconPlus from '../../components/Icon/IconPlus';
import Swal from 'sweetalert2';
import Select, { SingleValue, StylesConfig } from 'react-select';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrash from '../../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { useLocation } from 'react-router-dom';
import IconSave from '../../components/Icon/IconSave';
import IconRestore from '../../components/Icon/IconRestore';
import { be } from '@fullcalendar/core/internal-common';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconTxtFile from '../../components/Icon/IconTxtFile';
import IconShoppingCart from '../../components/Icon/IconShoppingCart';
import IconMinusCircle from '../../components/Icon/IconMinusCircle';
import IconBox from '../../components/Icon/IconBox';
import IconChartSquare from '../../components/Icon/IconChartSquare';
import IconMenuFontIcons from '../../components/Icon/Menu/IconMenuFontIcons';
import StokAnaliz from '../../components/YemDetay/StokAnaliz';
import TuketimAnaliz from '../../components/YemDetay/TuketimAnaliz';

interface DefData {
    besinDegeriID: string;
    tipID: string;
    besinTipi: string;
    miktar: string;
    birimID: string;
    birimAdi: string;
}
interface MetaData {
    yemID: string;
    yemAdi: string;
    durum: string;
    yemAciklama: string;
    firmaAdi?: string; // Optional property added
}
interface SelectedData {
    besinDegeriID: string;
    tipID: string;
    birimAdi: string;
    miktar: string;
}
interface OptionType {
    value: string;
    label: string;
    unit: string;
}
interface RejectData {
    redID: string;
    RededilmeNedeni: string;
    RededilmeTarihi: string;
    ReddedenKullanıcı: string;
}
const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<DefData[]>([]);
    const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
    const [unitOpitons, setUnitOptions] = useState<OptionType[]>([]);
    const [typeOpitons, setTypeOptions] = useState<OptionType[]>([]);
    const [metaData, setMetaData] = useState<MetaData | null>(null);
    const [modalEdit, setModalAddEdit] = useState(false);

    const location = useLocation();
    const initID = (location.state as { yemID?: string })?.yemID ?? null;
    const [yemID, setYemID] = useState<string | null>(initID);

    //-----------Veriyi burdan çekiliyor-----------
    useEffect(() => {
        const fetchData = async () => {
            if (!yemID) {
                setMetaData(null);
                setRowData([]);
                return;
            }

            try {
                const response = await fetch('http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariDetay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ yemID }),
                });
                const data = await response.json();

                // Üst bilgileri ayır
                const { yemID: id, yemAdi, durum, yemAciklama, firmaAdi, besinDegerleri } = data;

                // State’lere ata
                setMetaData({
                    yemID: String(id), // API’den number gelebilir, biz string istiyoruz
                    yemAdi,
                    durum,
                    firmaAdi: firmaAdi ?? t('General Feed Definition'),
                    yemAciklama,
                });
                setRowData(besinDegerleri);
            } catch (err) {
                console.error('API çağrısı sırasında hata:', err);
            }

            // Tip fetch ile alıyoruz
            try {
                const { data: birimler } = await axios.get('http://localhost:3030/api/tanimlamalar/birimler/getBesinTipleri');
                const unitOptions = birimler.map((o: any) => ({
                    value: o.tipID,
                    label: o.tipAdi,
                    unit: `${o.birimAdi} – ${o.aciklama}`,
                }));
                setUnitOptions(unitOptions);
            } catch (err) {
                console.error('Birim seçenekleri alınırken hata:', err);
            }
        };

        fetchData();
    }, [yemID]);
    const menuStyles: StylesConfig<OptionType, false> = {
        // this ensures the portal’ed menu sits above everything else
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };
    const UnitSelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
            form.setFieldValue('birimAdi', selectedOption ? selectedOption.unit : '');
        };

        return (
            <Select
                options={options}
                value={options ? options.find((option) => option.value === field.value) : null}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={menuStyles}
                onChange={handleChange}
                placeholder={t('Please Select')}
                isSearchable={true}
                isClearable={true}
            />
        );
    };

    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('Feed Definition')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<DefData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'birimID');
        setInitialRecords(sortedData);
    }, [rowData]);

    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modalDelete, setModalDelete] = useState(false);
    const [modalAdd, setModalAdd] = useState(false);
    const [delID, setDelID] = useState('');
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'birimID',
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
                    item.besinDegeriID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.besinTipi.toLowerCase().includes(search.toLowerCase()) ||
                    item.miktar.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.birimID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.birimAdi.toLowerCase().includes(search.toLowerCase()) ||
                    item.tipID.toString().toLowerCase().includes(search.toLowerCase())
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

    const submitDataFormValidation = Yup.object().shape({
        tipID: Yup.string(),
        miktar: Yup.string().required(t('Please Fill In')),
    });

    const [feedDeleteModal, setFeedDeleteModal] = useState(false);
    const [applayModal, setApplayModal] = useState(false);

    //-----------Tab yapısı-----------
    const [tabs, setTabs] = useState<string>('nutrition');
    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    //-----------Red Bigileri Tablosu Fonksiyonları-----------
    const [initialRecordsReject, setInitialRecordsReject] = useState<RejectData[]>([]);
    const [recordsDataReject, setRecordsDataReject] = useState(initialRecordsReject);
    const [pageReject, setPageReject] = useState(1);
    const PAGE_SIZESReject = [10, 20, 30, 50, 100];
    const [pageSizeReject, setPageSizeReject] = useState(PAGE_SIZESReject[0]);
    const [searchReject, setSearchReject] = useState('');

    const [sortStatusReject, setSortStatusReject] = useState<DataTableSortStatus>({
        columnAccessor: 'redID',
        direction: 'asc',
    });

    useEffect(() => {
        const from = (pageReject - 1) * pageSizeReject;
        const to = from + pageSizeReject;
        const safeArray = initialRecordsReject ?? []; // null ise []
        const pageSlice = safeArray.slice(from, to); // asla null slice olmaz
        setRecordsDataReject(pageSlice);
    }, [pageReject, pageSizeReject, initialRecordsReject]);
    useEffect(() => {
        const fetchRejectData = async () => {
            if (!yemID) {
                setInitialRecordsReject([]);
                return;
            }

            try {
                const response = await fetch('http://localhost:3030/api/basvurular/yem/postYemRedleri', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ yemID }),
                });
                const data = await response.json();
                setInitialRecordsReject(data);
            } catch (err) {
                console.error('API çağrısı sırasında hata:', err);
            }
        };

        fetchRejectData();
    }, [yemID]);

    useEffect(() => {
        const sortedData = sortBy(initialRecordsReject, 'redID');
        setInitialRecordsReject(sortedData);
    }, [initialRecordsReject]);

    useEffect(() => {
        setInitialRecordsReject(() => {
            return initialRecordsReject.filter((item) => {
                return (
                    item.redID.toString().toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.RededilmeNedeni.toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.RededilmeTarihi.toString().toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.ReddedenKullanıcı.toString().toLowerCase().includes(searchReject.toLowerCase())
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchReject]);

    const consumption = () => {
        if (yemID) {
            navigate(`/cifci/TuketimKaydi`, { state: { yemID } });
        } else {
            console.error('Yem ID bulunamadı.');
        }
    };

    return (
        <div>
            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        {t('Feed Details')} - <span className="badge bg-primary text-white">{metaData?.firmaAdi}</span>
                    </h5>
                </div>
                <div className="p-5">
                    <Formik
                        initialValues={{
                            yemID: metaData?.yemID || null,
                            yemAdi: metaData?.yemAdi || '',
                            durum: metaData?.durum || 'b',
                            yemAciklama: metaData?.yemAciklama || '',
                        }}
                        enableReinitialize
                        validationSchema={Yup.object().shape({
                            yemAdi: Yup.string().required(t('Please Fill In')),
                            durum: Yup.string().required(t('Please Fill In')),
                            yemAciklama: Yup.string(),
                        })}
                        onSubmit={() => {}}
                    >
                        {({ errors, touched, submitCount }) => (
                            <Form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">{t('Feed Name')}</label>
                                        <Field name="yemAdi" className={`form-input ${errors.yemAdi && touched.yemAdi ? 'border-danger' : ''}`} readOnly />
                                        {submitCount ? errors.yemAdi ? <div className="text-danger mt-1">{errors.yemAdi}</div> : <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div> : ''}
                                    </div>
                                    <div>
                                        <label className="form-label">{t('Status')}</label>
                                        <Field as="select" name="durum" className={`form-input ${errors.durum && touched.durum ? 'border-danger' : ''}`} readOnly>
                                            <option value="" disabled={true}>
                                                {t('Please Select')}
                                            </option>
                                            <option value="a" disabled={metaData?.durum == 'p' || metaData?.durum == 'b' || metaData == null}>
                                                {t('Active')}
                                            </option>
                                            <option value="p" disabled={metaData?.durum == 'p' || metaData?.durum == 'b' || metaData == null}>
                                                {t('Passive')}
                                            </option>
                                            <option value="b" disabled={true}>
                                                {t('Pending')}
                                            </option>
                                        </Field>
                                        {submitCount ? errors.durum ? <div className="text-danger mt-1">{errors.durum}</div> : <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div> : ''}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">{t('Description')}</label>
                                        <Field as="textarea" name="yemAciklama" className={`form-input ${errors.yemAciklama && touched.yemAciklama ? 'border-danger' : ''}`} readOnly />
                                        {submitCount ? (
                                            errors.yemAciklama ? (
                                                <div className="text-danger mt-1">{errors.yemAciklama}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-start gap-2">
                                    <button type="button" className="btn btn-secondary gap-2" onClick={() => consumption()}>
                                        <IconMinusCircle />
                                        {t('Consumption Record')}
                                    </button>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button type="button" className="btn btn-success gap-2">
                                        <IconShoppingCart />
                                        {t('Give Order')}
                                    </button>
                                    <button type="button" className="btn btn-primary gap-2">
                                        <IconMenuFontIcons />
                                        {t('Start a Tender')}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
            <div className="pt-5">
                <ul className="sm:flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('nutrition')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'nutrition' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconTxtFile />
                            {t('Feed Nutrition')}
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('feed-stock')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'feed-stock' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconBox />
                            {t('Feed Stock Analysis')}
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('feed-need')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'feed-need' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconChartSquare />
                            {t('Feed Consumption And Need Analysis')}
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('feed-reject')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'feed-reject' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconXCircle />
                            {t('Feed Reject Reasons')}
                        </button>
                    </li>
                </ul>
            </div>
            {tabs === 'nutrition' ? (
                <div className="panel mt-6">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('Feed Content')}</h5>
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
                                    accessor: 'besinDegeriID',
                                    title: t('ID'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'besinTipi',
                                    title: t('Nutrition Type'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'miktar',
                                    title: t('Cuantity'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'birimAdi',
                                    title: t('Unit'),
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
            ) : (
                ''
            )}
            {tabs === 'feed-stock' ? (
                <div>
                    <StokAnaliz yemID={yemID!} firmaID={userInfo.firmaID}></StokAnaliz>
                </div>
            ) : (
                ''
            )}
            {tabs === 'feed-need' ? (
                <div>
                    <TuketimAnaliz yemID={yemID!} firmaID={userInfo.firmaID}></TuketimAnaliz>
                </div>
            ) : (
                ''
            )}
            {tabs === 'feed-reject' ? (
                <div className="panel mt-6">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('Feed Content')}</h5>
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearchReject(e.target.value)} />
                        </div>
                    </div>
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={recordsDataReject}
                            columns={[
                                {
                                    accessor: 'redID',
                                    title: t('ID'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'RededilmeNedeni',
                                    title: t('Reject Reason'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'RededilmeTarihi',
                                    title: t('Reject Date'),
                                    sortable: true,
                                },
                                {
                                    accessor: 'ReddedenKullanıcı',
                                    title: t('Rejected By'),
                                    sortable: true,
                                },
                            ]}
                            totalRecords={initialRecordsReject.length}
                            recordsPerPage={pageSizeReject}
                            page={pageReject}
                            onPageChange={(p) => setPageReject(p)}
                            recordsPerPageOptions={PAGE_SIZESReject}
                            onRecordsPerPageChange={setPageSizeReject}
                            sortStatus={sortStatusReject}
                            onSortStatusChange={setSortStatusReject}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            ) : (
                ''
            )}
        </div>
    );
};

export default MultipleTables;

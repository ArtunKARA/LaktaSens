import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useEffect, useState, Fragment } from 'react';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconHome from '../../../../components/Icon/IconHome';
import IconDollarSignCircle from '../../../../components/Icon/IconDollarSignCircle';
import IconTrash from '../../../../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import Select, { SingleValue } from 'react-select';
import axios from 'axios';
import IconNotes from '../../../../components/Icon/IconNotes';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import IconX from '../../../../components/Icon/IconX';
import { strict } from 'assert';
import { padEnd } from 'lodash';
import IconPencilPaper from '../../../../components/Icon/IconPencilPaper';
import IconChatDots from '../../../../components/Icon/IconChatDots';
import IconTrendingUp from '../../../../components/Icon/IconTrendingUp';
import IconMenu from '../../../../components/Icon/IconMenu';
import IconUser from '../../../../components/Icon/IconUser';
import IconPlus from '../../../../components/Icon/IconPlus';
import IconEdit from '../../../../components/Icon/IconEdit';
import IconEye from '../../../../components/Icon/IconEye';

const AccountSetting = () => {
    interface OptionType {
        value: string;
        label: string;
    }

    interface UserData {
        kullaniciID: string;
        tcNo: string;
        isim: string;
        soyisim: string;
        eposta: string;
        telefonNo: string;
        hesapFirmaYetkisi: string;
        hesapDurumu: string;
        firmaID: number;
        firmaAdi: string;
    }
    interface firmaInfo {
        firmaAdi: string;
        telefonNo: string;
        firmaAdresi: string;
        sehirID: string;
        ilceID: string;
        bolge: string;
        hesapDurumu: string;
        firmaMail: string;
    }
    
    interface RejectsData {
        redID: string;
        RededilmeNedeni: string;
        RededilmeTarihi: string;
        ReddedenKullanıcı: string;
    }

    interface BillList {
        id: string,
        invoice: string,
        name: string,
        email: string,
        date: string,
        amount: string,
        status: { tooltip: 'Paid', color: 'success' },
    }

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [firmaInfo, setFirmaInfo] = useState<firmaInfo | null>(null);
    const [firmaInfoUsers, setFirmaInfoUsers] = useState<UserData[]>([]);
    const [cityOpitons, setCityOptions] = useState<OptionType[]>([]);
    const [districtOpitons, setDistrictOptions] = useState<OptionType[]>([]);
    const [hesapSil, setHesapSil] = useState(false);
    const [hesapDondur, setHesapDondur] = useState(false);
    const [hesapPasif, setHesapPasif] = useState(false);
    const [hesapAktifleştir, setHesapAktifleştir] = useState(false);
    const [ciftlikSil, setCiftlikSil] = useState(false);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [isVisibleFirmaKullaniciEkle, setisVisibleFirmaKullaniciEkle] = useState(false);
    const [search, setSearch] = useState('');
    const [searchReject, setSearchReject] = useState('');
    const [initialRecords, setInitialRecords] = useState<UserData[]>([]);
    const [initialRecordsRejects, setInitialRecordsRejects] = useState<RejectsData[]>([]);
    const [rowData, setRowData] = useState<UserData[]>([]);
    const [rowDataReject, setRowDataReject] = useState<RejectsData[]>([]);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [pageSizeReject, setPageSizeReject] = useState(PAGE_SIZES[0]);
    const [page, setPage] = useState(1);
    const [pageReject, setPageReject] = useState(1);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [recordsDataRejects, setRecordsDataRejects] = useState(initialRecordsRejects);
    const [modal22, setModal22] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const location = useLocation();
    const [isVisibleOdemeBilgileri, setisVisibleOdemeBilgileri] = useState(false);
    const [isVisibleOdemeler, setisVisibleOdemeler] = useState(false);
    const { CompanyID } = location.state || {};


    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'kullaniciID',
        direction: 'asc',
    });

    const [sortStatusReject, setSortStatusReject] = useState<DataTableSortStatus>({
        columnAccessor: 'redID',
        direction: 'asc',
    });

    const optionsFirmaKullanıcıYetkis = [
        { value: 'a', label: t('Admin') },
        { value: 'k', label: t('User') },
        { value: 'n', label: t('NaN') },
    ];

    const statusOptions = [
        { value: 'a', label: t('Active') },
        { value: 'p', label: t('Passive') },
        { value: 'b', label: t('On hold') },
        { value: 'n', label: 'NaN' }
    ];

    
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        setPageReject(1);
    }, [setPageReject]);

    useEffect(() => {
        const sortedData = sortBy(rowData, 'kullaniciID');
        setInitialRecords(sortedData);
    }, [rowData]);

    useEffect(() => {
        const sortedDataReject = sortBy(rowDataReject, 'redID');
        setInitialRecordsRejects(sortedDataReject);
    }, [rowDataReject]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const from = (pageReject - 1) * pageSizeReject;
        const to = from + pageSizeReject;
        setRecordsDataRejects([...initialRecordsRejects.slice(from, to)]);
    }, [pageReject, pageSizeReject, initialRecordsRejects]);

    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item) => {
                return (
                    item.kullaniciID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.eposta.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.hesapDurumu.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.hesapFirmaYetkisi.toLowerCase().includes(search.toLowerCase()) ||
                    item.isim.toLowerCase().includes(search.toLowerCase()) ||
                    item.soyisim.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.telefonNo.toString().toLowerCase().includes(search.toLowerCase())
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);
    useEffect(() => {
        setInitialRecordsRejects(() => {
            return rowDataReject.filter((item) => {
                return (
                    item.redID.toString().toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.ReddedenKullanıcı.toString().toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.RededilmeNedeni.toString().toLowerCase().includes(searchReject.toLowerCase()) ||
                    item.RededilmeTarihi.toLowerCase().includes(searchReject.toLowerCase())
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchReject]);
    useEffect(() =>  {
        const fetchData = async () => {
          try {
            const response = await axios.post("http://localhost:3030/api/firma/postFirmaBilgileriGetir", {
              firmaID: CompanyID,
            });
            console.log(response.data);

            const firmaInfo = {
                firmaAdi: response.data!.firmaAdi,
                telefonNo: response.data!.telefonNo,
                firmaAdresi: response.data!.firmaAdresi,
                sehirID: response.data!.sehirID,
                ilceID: response.data!.ilceID,
                bolge: response.data!.bolge,
                hesapDurumu: response.data!.hesapDurumu,
                firmaMail: response.data!.firmaMail
            };
            await setFirmaInfo(firmaInfo!);
            await getDistrictList(firmaInfo!.sehirID);
          } catch (error) {
            console.error(error);
            alert(t("An error occurred while saving!") + error);
          }

          axios.get('http://localhost:3030/api/options/cityList')
          .then(response => {
              const cityOpitons = response.data.map((city: any) => ({
                  value: city.ID,
                  label: city.SehirIlceMahalleAdi
              }));
              setCityOptions(cityOpitons);
              console.log(cityOpitons);
          })
          .catch(error => {
              console.error('Error fetching city options:', error);
          });
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/firma/postFirmaKullanicilarGetir', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: CompanyID }),
                });
    
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
    
                const data: UserData[] = await response.json();
                console.log('Gelen veri:', data);
                setRowData(data);
    
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };
    
        fetchData();
    }, []); // Boş bağımlılık dizisi, component mount olduğunda sadece bir kez çalıştırılır

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/adminFirmalar/postFirmaRedBilgileri ', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: CompanyID }),
                });
    
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
    
                const data: RejectsData[] = await response.json();
                console.log('Gelen veri:', data);
                setRowDataReject(data);
    
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };
    
        fetchData();
    }, []); // Boş bağımlılık dizisi, component mount olduğunda sadece bir kez çalıştırılır

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);

    useEffect(() => {
        const data = sortBy(initialRecordsRejects, sortStatusReject.columnAccessor);
        setInitialRecordsRejects(sortStatusReject.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatusReject]);
    
    useEffect(() => {
        dispatch(setPageTitle(t('Supplier Details')));
    });

    const [tabs, setTabs] = useState<string>('home');

    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const submitUserFormValidation = Yup.object().shape({
        firstname: Yup.string().required('Please fill the first name'),
        lastname: Yup.string().required('Please fill the last name'),
        tcNumber: Yup.string()
        .required('Please provide a valid TC Number')
        .matches(/^[1-9][0-9]{10}$/, 'TC Number must be 11 digits and cannot start with 0')
        .test('is-valid-tc', 'Invalid TC Number', value => {
            if (!value) return false;
            const digits = value.split('').map(Number);
            const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
            const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
            const totalSum = oddSum + evenSum + digits[9];
            
            const rule10 = (oddSum * 7 - evenSum) % 10 === digits[9];
            const rule11 = totalSum % 10 === digits[10];
            
            return rule10 && rule11;
        }),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        password: Yup.string()
            .trim()
            .required('Please enter a password')
            .min(6, 'Password must be at least 6 characters')
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
            .matches(/\d/, 'Password must contain at least one number'),
        confirmPassword: Yup.string()
            .trim()
            .required('Please confirm your password')
            .oneOf([Yup.ref('password')], 'Passwords must match'),
        telefonNo: Yup.string().required('Please fill the telephone'),
        hesapFirmaYetkisi: Yup.string().required('Please fill the Company Auth'),
        hesapDurumu: Yup.string().required('Please fill the Account Status'),
    });

    const submitCompanyFormValidation = Yup.object().shape({
        city: Yup.string().required('Please provide a valid city'),
        district: Yup.string().required('Please provide a valid District'),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        telefonNo: Yup.string().required('Please fill the telephone'),
        firmaAdi: Yup.string().required('Please fill Commpany Name'),
        firmaAdresi: Yup.string().required('Please fill Commpany Address'),
    });


    const submitUpdateUserForm = (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Form user update dev',
            padding: '10px 20px',
        });
        console.log(values);    
    };

    const submitUpdateFarmForm = (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Form Farm update dev',
            padding: '10px 20px',
        });
        console.log(values);    
    };

    const submitAddFarmUserForm = (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Form Add Farm user update dev',
            padding: '10px 20px',
        });
        console.log(values);    
    };

    const submitUpdateFarmUserForm = (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Form Update Farm user update dev',
            padding: '10px 20px',
        });
        console.log(values);    
    };

    const CitySelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
            form.setFieldValue('district', '');
            getDistrictList(selectedOption ? selectedOption.value : '');
        };
    
        return (
            <Select
                options={options}
                value={options ? options.find(option => option.value === field.value) : null}
                onChange={handleChange}
                placeholder={t('Please select a city')}
                isSearchable={true}
                isClearable={true}
            />
        );
    };

    const DistrictSelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
        };
    
        return (
            <Select
                options={options}
                value={options ? options.find(option => option.value === field.value) : null}
                onChange={handleChange}
                placeholder={t('Please select a city')}
                isSearchable={true}
                isClearable={true}
            />
        );
    };

    const getDistrictList = (cityID: string) => {
        axios.get('http://localhost:3030/api/options/districtList?cityID=' + cityID)
            .then(response => {
                const districtOptions = response.data.map((district: any) => ({
                    value: district.ID,
                    label: district.SehirIlceMahalleAdi
                }));
                setDistrictOptions(districtOptions);
                console.log(districtOptions);
            })
            .catch(error => {
                console.error('Error fetching district options:', error);
            });
    };

    const statusColor = (durum : number) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if(durum == 0){
            return color[2]
        }else if(durum > 0  || durum < 4){
            return color[4]
        }else{
          return color[3]
        }
      };

    const statusColorYetki = (durum : String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if(durum == "a"){
            return color[2]
        }else if(durum == "k"){
            return color[0]
        }else{
          return color[3]
        }
    };

    const statusNameYetki = (durum : String) => {
        if(durum == "a"){
            return "Admin"
        }else if(durum == "k"){
            return "Kullanıcı"
        }else{
          return "NaN"
        }
    };

    const statusColorDurum = (durum : String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if(durum == "a"){
            return color[2]
        }else if(durum == "p"){
            return color[3]
        }else if(durum == "b"){
          return color[4]
        }else{
          return color[3]
        }
    }; 
    
    const statusNameDurum = (durum : String) => {
        if(durum == "a"){
            return "Admin"
        }else if(durum == "p"){
            return "Pasif"
        }else if(durum == "b"){
          return "Beklemede"
        }else{
          return "NaN"
        }
    };

    const deleteRow = (id: any = null) => {
        if (window.confirm(t('Are you sure want to delete selected row ?'))) {
            if (id) {
                setRecordsBillList(itemsBillList.filter((user) => user.id !== id));
                setInitialRecordsBillList(itemsBillList.filter((user) => user.id !== id));
                setItemsBillList(itemsBillList.filter((user) => user.id !== id));
                setSearchBillList('');
                setSelectedRecordsBillList([]);
            } else {
                let selectedRows = selectedRecordsBillList || [];
                const ids = selectedRows.map((d: any) => {
                    return d.id;
                });
                const result = itemsBillList.filter((d) => !ids.includes(d.id as never));
                setRecordsBillList(result);
                setInitialRecordsBillList(result);
                setItemsBillList(result);
                setSearchBillList('');
                setSelectedRecordsBillList([]);
                setPageBillList(1);
            }
        }
    };

    const [itemsBillList, setItemsBillList] = useState<BillList[]>([]);
    const [pageBillList, setPageBillList] = useState(1);
    const [pageSizeBillList, setPageSizeBillList] = useState(PAGE_SIZES[0]);
    const [initialRecordsBillList, setInitialRecordsBillList] = useState(sortBy(itemsBillList, 'invoice'));
    const [recordsBillList, setRecordsBillList] = useState(initialRecordsBillList);
    const [selectedRecordsBillList, setSelectedRecordsBillList] = useState<BillList[]>([]);

    const [searchBillList, setSearchBillList] = useState('');
    const [sortStatusBillList, setSortStatusBillList] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });

    useEffect(() => {
        setPageBillList(1);
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [pageSizeBillList]);

    useEffect(() => {
        const from = (pageBillList - 1) * pageSizeBillList;
        const to = from + pageSizeBillList;
        setRecordsBillList([...initialRecordsBillList.slice(from, to)]);
    }, [pageBillList, pageSizeBillList, initialRecordsBillList]);

    useEffect(() => {
        setInitialRecordsBillList(() => {
            return itemsBillList.filter((item) => {
                return (
                    item.invoice.toLowerCase().includes(searchBillList.toLowerCase()) ||
                    item.name.toLowerCase().includes(searchBillList.toLowerCase()) ||
                    item.email.toLowerCase().includes(searchBillList.toLowerCase()) ||
                    item.date.toLowerCase().includes(searchBillList.toLowerCase()) ||
                    item.amount.toLowerCase().includes(searchBillList.toLowerCase()) ||
                    item.status.tooltip.toLowerCase().includes(searchBillList.toLowerCase())
                );
            });
        });
    }, [searchBillList]);

    useEffect(() => {
        const data2 = sortBy(initialRecordsBillList, sortStatusBillList.columnAccessor);
        setRecordsBillList(sortStatusBillList.direction === 'desc' ? data2.reverse() : data2);
        setPageBillList(1);
    }, [sortStatusBillList]);

    return (
        <div>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light"><span className="text-s bg-yellow-50 rounded text-yellow-600 px-4">{t('Farmer Info')}</span><span className="text-s badge badge-outline-primary px-4 ltr:ml-8 rtl:ml-8">{firmaInfo?.firmaAdi}</span></h5>
                </div>
                <div>
                    <ul className="sm:flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('home')}
                                className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'home' ? '!border-primary text-primary' : ''}`}
                            >
                                <IconHome />
                                {t('Home')}
                            </button>
                        </li>

                        {userInfo.hesapFirmaYetkisi === 'a' && (
                        <li className="inline-block">
                            <button
                            onClick={() => toggleTabs('manage-user')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${
                                tabs === 'manage-user' ? '!border-primary text-primary' : ''
                            }`}
                            >
                            <IconUser />
                            {t("Manage User")}
                            </button>
                        </li>
                        )}
                        {userInfo.hesapFirmaYetkisi === 'a' && (
                        <li className="inline-block">
                            <button
                            onClick={() => toggleTabs('manage-payment')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${
                                tabs === 'manage-payment' ? '!border-primary text-primary' : ''
                            }`}
                            >
                            <IconDollarSignCircle />
                            {t("Manage Payment")}
                            </button>
                        </li>
                        )}
                        {userInfo.hesapFirmaYetkisi === 'a' && (
                        <li className="inline-block">
                            <button
                            onClick={() => toggleTabs('analysis')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${
                                tabs === 'analysis' ? '!border-primary text-primary' : ''
                            }`}
                            >
                            <IconTrendingUp />
                            {t("Analysis")}
                            </button>
                        </li>
                        )}
                        <li className="inline-block">
                            <button
                                onClick={() => toggleTabs('danger-zone')}
                                className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'danger-zone' ? '!border-primary text-primary' : ''}`}
                            >
                                <IconTrash />
                                {t("Danger Zone")}
                            </button>
                        </li>
                    </ul>
                </div>
                {tabs === 'home' ? (
                    <><div>
                        <Formik
                            initialValues={{
                                firmaAdi: firmaInfo?.firmaAdi,
                                telefonNo: firmaInfo?.telefonNo,
                                firmaAdresi: firmaInfo?.firmaAdresi,
                                email: firmaInfo?.firmaMail,
                                city: firmaInfo?.sehirID,
                                district: firmaInfo?.ilceID,
                            }}
                            enableReinitialize
                            validationSchema={submitCompanyFormValidation}
                            onSubmit={() => { } }
                        >{({ errors, submitCount, touched, values }) => (
                            <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black panel mt-6">
                                <h6 className="text-lg font-bold mb-5">{t('Supplier Info')}</h6>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ paddingTop: '1%'}}>
                                    <div>
                                        <label htmlFor="firmaAdi">{t('Farm Name')}</label>
                                        <Field name="firmaAdi" id="firmaAdi" type="text" className="form-input" />
                                        {submitCount ? (
                                            errors.firmaAdi ? (
                                                <div className="text-danger mt-1">{errors.firmaAdi}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                </div>
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="firmaBollge">{t('Company Area')}</label>
                                        {(() => {
                                            if (firmaInfo?.bolge === 'a') {
                                                return <span id="firmaBollge" className="badge bg-success text-lg block mx-auto text-center">İç Anadolu</span>;
                                            } else if (firmaInfo?.bolge === 'b')  {
                                                return <span id="firmaBollge"  className="badge bg-primary text-lg block mx-auto text-center">Marmara</span>;
                                            } else {
                                                return <span id="firmaBollge"  className="badge bg-dark text-lg block mx-auto text-center">NaN</span>;; // Return nothing if no condition matches
                                            }
                                        })()}
                                    </div>
                                    <div>
                                        <label htmlFor="hesapDurumu">{t('Account Status')}</label>
                                        {(() => {
                                            if (firmaInfo?.hesapDurumu === 'a') {
                                                return <span id="hesapDurumu" className="badge bg-success text-lg block mx-auto text-center">{t('Active')}</span>;
                                            } else if (firmaInfo?.hesapDurumu === 'p')  {
                                                return <span id="hesapDurumu"  className="badge bg-red-500 text-lg block mx-auto text-center">{t('Passive')}</span>;
                                            } else if (firmaInfo?.hesapDurumu === 'b')  {
                                                return <span id="hesapDurumu"  className="badge bg-primary text-lg block mx-auto text-center">{t('On hold')}</span>;
                                            }else {
                                                return <span id="hesapDurumu"  className="badge bg-dark text-lg block mx-auto text-center">NaN</span>;; // Return nothing if no condition matches
                                            }
                                        })()}
                                    </div>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5" style={{ paddingTop: '1%' }}>
                                    <div>
                                        <label htmlFor="firmaAdresi">{t('Address')}</label>
                                        <Field className="form-textarea" as="textarea" name="firmaAdresi" id="firmaAdresi" rows="3" placeholder={t('Enter Address')} />
                                        {submitCount ? (
                                            errors.firmaAdresi ? (
                                                <div className="text-danger mt-1">{errors.firmaAdresi}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">Looks Good!</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ paddingTop: '1%' }}>
                                    <div>
                                        <label htmlFor="Email">{t('Email')}</label>
                                        <Field name="email" type="text" id="Email" placeholder={t('Enter Email')} className="form-input" />

                                        {submitCount ? errors.email ? <div className="text-danger mt-1">{errors.email}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                    </div>
                                    <div>
                                        <label htmlFor="telefonNo">{t('Telephone')}</label>
                                        <Field name="telefonNo" id="lastname" type="text" className="form-input" />
                                        {submitCount ? (
                                            errors.telefonNo ? (
                                                <div className="text-danger mt-1">{errors.telefonNo}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="city">{t('City')}</label>
                                        <Field
                                            name="city"
                                            component={CitySelect}
                                            options={cityOpitons} />
                                        {submitCount ? (
                                            errors.city ? (
                                                <div className="text-danger mt-1">{errors.city}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="district">{t('District')}</label>
                                        <Field
                                            name="district"
                                            component={DistrictSelect}
                                            options={values.city === null ? [{ value: '', label: 'Please select a city first' }] : districtOpitons} />
                                        {submitCount ? (
                                            errors.district ? (
                                                <div className="text-danger mt-1">{errors.district}</div>
                                            ) : (
                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </div>

                                    <div className="sm:col-span-2 mt-3">
                                        <button
                                            type="submit"
                                            className="btn btn-primary !mt-6"
                                            onClick={() => {
                                                console.log(Object.keys(errors));
                                                if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                    submitUpdateFarmForm(values);
                                                }
                                            } }
                                        >
                                            {t('Save')}
                                        </button>
                                    </div>
                                </div>
                            </Form>)}
                        </Formik>
                    </div>
                    <div>
                            <div className="panel mt-6">
                                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Rejects')}</h5>
                                    <div className="ltr:ml-auto rtl:mr-auto">
                                        <input type="text" className="form-input w-auto" placeholder="Search..." value={searchReject} onChange={(e) => setSearchReject(e.target.value)} />
                                    </div>
                                </div>
                                <div className="datatables">
                                    <DataTable
                                        className="whitespace-nowrap table-hover"
                                        records={recordsDataRejects}
                                        columns={[
                                            {
                                                accessor: 'redID',
                                                title: t('ID'),
                                                sortable: true
                                            },
                                            {
                                                accessor: 'RededilmeNedeni',
                                                title: t('Rejection Reason'),
                                                sortable: true
                                            },
                                            {
                                                accessor: 'RededilmeTarihi',
                                                title: t('Reject Date'),
                                                sortable: true
                                            },
                                            {
                                                accessor: 'ReddedenKullanıcı',
                                                title: t('Rejecter User'),
                                                sortable: true,
                                            }
                                        ]}
                                        totalRecords={initialRecordsRejects.length}
                                        recordsPerPage={pageSize}
                                        page={page}
                                        onPageChange={(p) => setPageReject(p)}
                                        recordsPerPageOptions={PAGE_SIZES}
                                        onRecordsPerPageChange={setPageSizeReject}
                                        sortStatus={sortStatusReject}
                                        onSortStatusChange={setSortStatusReject}
                                        minHeight={200}
                                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`} />
                                </div>
                            </div>
                        </div></>
                ) : (
                    ''
                )}
                {tabs === 'manage-user' ? (
                    <div className="switch">
                        <div>
                            <div className="panel mt-6">
                                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Users')}</h5>
                                    <button type="button" className="btn btn-warning ltr:ml-auto rtl:mr-auto" onClick={() => {setisVisibleFirmaKullaniciEkle(!isVisibleFirmaKullaniciEkle);}}>{t('Add User')}</button>
                                    <div className="ltr:ml-auto rtl:mr-auto">
                                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                    </div>
                                    <Transition appear show={isVisibleFirmaKullaniciEkle} as={Fragment}>
                                        <Dialog as="div" open={isVisibleFirmaKullaniciEkle} onClose={() => setisVisibleFirmaKullaniciEkle(false)}>
                                        <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                            <div className="flex min-h-screen items-center justify-center px-4">
                                            <Dialog.Panel className="panel my-8 w-full max-w-3xl overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">

                                                <div className="flex items-center justify-between p-5">
                                                <h5> {t('Manage User')} </h5>
                                                <button
                                                    type="button"
                                                    onClick={() => setisVisibleFirmaKullaniciEkle(false)}
                                                    className="text-white-dark hover:text-dark"
                                                >
                                                    <IconX className="w-5 h-5" />
                                                </button>
                                                </div>
                                                <div>
                                                <Formik
                                                    enableReinitialize={true} 
                                                    initialValues={{
                                                        kullaniciID: '',
                                                        firstname: '',
                                                        lastname: '',
                                                        tcNumber: '',
                                                        email: '',
                                                        telefonNo: '',
                                                        password: '',
                                                        confirmPassword: '',
                                                        hesapFirmaYetkisi: '',
                                                        hesapDurumu: '',
                                                    }}
                                                    validationSchema={submitUserFormValidation}
                                                    onSubmit={() => {}}
                                                >{({ errors, submitCount, touched, values }) => (
                                                    <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                                        <div className="flex flex-col sm:flex-row">
                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                <div>
                                                                    <label htmlFor="firstname">{t('Name')}</label>
                                                                    <Field name="firstname" id="firstname" type="text" className="form-input" />
                                                                    {submitCount ? (
                                                                        errors.firstname ? (
                                                                            <div className="text-danger mt-1">{errors.firstname?.toString()}</div>
                                                                        ) : (
                                                                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="lastname">{t('Last Name')}</label>
                                                                    <Field name="lastname" id="lastname" type="text" className="form-input" />
                                                                    {submitCount ? (
                                                                        errors.lastname ? (
                                                                            <div className="text-danger mt-1">{errors.lastname?.toString()}</div>
                                                                        ) : (
                                                                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="telefonNo">{t('Telephone')}</label>
                                                                    <Field name="telefonNo" type="text" id="telefonNo" placeholder={t('Enter Telephone')} className="form-input" />

                                                                    {submitCount ? (
                                                                        errors.telefonNo ? (
                                                                            <div className="text-danger mt-1">{errors.telefonNo?.toString()}</div>
                                                                        ) : (
                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <label htmlFor="Email">{t('Email')}</label>
                                                                    <Field name="email" type="text" id="Email" placeholder={t('Enter Email')} className="form-input" />

                                                                    {submitCount ? errors.email ? <div className="text-danger mt-1">{errors.email?.toString()}</div> : <div className="text-success mt-1">{t('Looks Good!')}</div> : ''}
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="tcNumber">{t('TC Number')}</label>
                                                                    <Field name="tcNumber" type="text" id="tcNumber" placeholder={t('Enter TC Number')} className="form-input" />

                                                                    {submitCount ? (
                                                                        errors.tcNumber ? (
                                                                            <div className="text-danger mt-1">{errors.tcNumber?.toString()}</div>
                                                                        ) : (
                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                <div>
                                                                        <label htmlFor="hesapFirmaYetkisi">{t('Account Company Authorization')}</label>
                                                                        <Select
                                                                            id="hesapFirmaYetkisi"
                                                                            options={optionsFirmaKullanıcıYetkis}
                                                                            isSearchable={false}
                                                                            onChange={(selectedOption) => {
                                                                                values.hesapFirmaYetkisi = selectedOption!.value
                                                                            }}
                                                                        />
                                                                         {submitCount ? (
                                                                            errors.hesapFirmaYetkisi ? (
                                                                                <div className="text-danger mt-1">{errors.hesapFirmaYetkisi}</div>
                                                                            ) : (
                                                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                            )
                                                                        ) : (
                                                                            ''
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label htmlFor="hesapDurumu">{t('Account Status')}</label>
                                                                        <Select
                                                                            id="hesapDurumu"
                                                                            options={statusOptions}
                                                                            isSearchable={false}                                                                            onChange={(selectedOption) => {
                                                                                values.hesapDurumu = selectedOption!.value
                                                                            }}
                                                                        />
                                                                      {submitCount ? (
                                                                            errors.hesapDurumu ? (
                                                                                <div className="text-danger mt-1">{errors.hesapDurumu}</div>
                                                                            ) : (
                                                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                            )
                                                                        ) : (
                                                                            ''
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="password">{t('Password')}</label>
                                                                    <Field name="password" type="password" id="password" placeholder={t('Enter Password')} className="form-input" />

                                                                    {submitCount ? (
                                                                        errors.password ? (
                                                                            <div className="text-danger mt-1">{errors.password}</div>
                                                                        ) : (
                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="confirmPassword">{t('Confirm Password')}</label>
                                                                    <Field name="confirmPassword" type="password" id="confirmPassword" placeholder={t('Enter Password')} className="form-input" />

                                                                    {submitCount ? (
                                                                        errors.confirmPassword ? (
                                                                            <div className="text-danger mt-1">{errors.confirmPassword}</div>
                                                                        ) : (
                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                        )
                                                                    ) : (
                                                                        ''
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                <button
                                                                        type="submit"
                                                                        className="btn btn-primary !mt-6"
                                                                        onClick={() => {
                                                                            console.log(Object.keys(errors));
                                                                            if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                                                submitAddFarmUserForm(values);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {t('Save')}
                                                                    </button>
                                                                    <button
                                                                        type="submit"
                                                                        className="btn btn-danger !mt-6"
                                                                        onClick={() => {
                                                                            setisVisibleFirmaKullaniciEkle(false)
                                                                        }}
                                                                    >
                                                                        {t('Cancel')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Form>)}
                                                </Formik>
                                            </div>
                                            </Dialog.Panel>
                                            </div>
                                        </div>
                                        </Dialog>
                                    </Transition>
                                </div>    
                                
                                <div className="datatables">
                                    <DataTable
                                        className="whitespace-nowrap table-hover"
                                        records={recordsData}
                                        columns={[
                                            {
                                                accessor: 'kullaniciID',
                                                title: t('ID'),
                                                sortable: true
                                            },
                                            {
                                                accessor: 'isim',
                                                title: t('Name'),
                                                sortable: true
                                            },
                                            {
                                                accessor: 'soyisim',
                                                title: t('Last Name'),
                                                sortable: true,
                                            },
                                            {
                                                accessor: 'eposta',
                                                title: t('Email'),
                                                sortable: true,
                                            },
                                            {
                                                accessor: 'telefonNo',
                                                title: t('Telephone'),
                                                sortable: true,
                                            },
                                            {
                                                accessor: 'hesapFirmaYetkisi',
                                                title: t('Account Company Authorization'),
                                                sortable: true,
                                                render: ({ hesapFirmaYetkisi }) => <span className={`badge bg-${statusColorYetki(hesapFirmaYetkisi)}`}>{statusNameYetki(hesapFirmaYetkisi)}</span>, 
                                            },
                                            {
                                                accessor: 'hesapDurumu',
                                                title: t('Account Status'),
                                                sortable: true,
                                                render: ({ hesapDurumu }) => <span className={`badge bg-${statusColorDurum(hesapDurumu)}`}>{statusNameDurum(hesapDurumu)}</span>, 
                                            },
                                            {
                                                accessor: 'manage',
                                                title: t('Manage'),
                                                titleClassName: '!text-center',
                                                render: ({kullaniciID, isim, soyisim, tcNo, eposta, telefonNo, hesapFirmaYetkisi, hesapDurumu, firmaID}) => (
                                                    <div className="flex items-center w-max mx-auto gap-2">
                                                        <Tippy>
                                                            <button type="button"
                                                            onClick={() => {
                                                                setSelectedUser({
                                                                    kullaniciID: kullaniciID,
                                                                    isim: isim,
                                                                    soyisim: soyisim,
                                                                    tcNo: tcNo,
                                                                    eposta: eposta,
                                                                    telefonNo: telefonNo,
                                                                    hesapFirmaYetkisi: hesapFirmaYetkisi,
                                                                    hesapDurumu: hesapDurumu,
                                                                    firmaID: firmaID,                     
                                                                    firmaAdi: ' '
                                                                });
                                                                setModal22(true);
                                                            }}>
                                                                <IconPencilPaper/>
                                                            </button>
                                                        </Tippy>
                                                      <Transition appear show={modal22} as={Fragment}>
                                                      <Dialog as="div" open={modal22} onClose={() => setModal22(false)}>
                                                        <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                                          <div className="flex min-h-screen items-center justify-center px-4">
                                                          <Dialog.Panel className="panel my-8 w-full max-w-3xl overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">

                                                              <div className="flex items-center justify-between p-5">
                                                                <h5> {t('Manage User')} </h5>
                                                                <button
                                                                  type="button"
                                                                  onClick={() => setModal22(false)}
                                                                  className="text-white-dark hover:text-dark"
                                                                >
                                                                  <IconX className="w-5 h-5" />
                                                                </button>
                                                              </div>
                                                              <div>
                                                              <Formik
                                                                    enableReinitialize={true} 
                                                                    initialValues={{
                                                                        kullaniciID: selectedUser?.kullaniciID || '',
                                                                        firstname: selectedUser?.isim || '',
                                                                        lastname: selectedUser?.soyisim || '',
                                                                        tcNumber: selectedUser?.tcNo || '',
                                                                        email: selectedUser?.eposta || '',
                                                                        telefonNo: selectedUser?.telefonNo || '',
                                                                        password: '',
                                                                        confirmPassword: '',
                                                                        hesapFirmaYetkisi: '',
                                                                        hesapDurumu: '',
                                                                    }}
                                                                    validationSchema={submitUserFormValidation}
                                                                    onSubmit={() => {}}
                                                                >{({ errors, submitCount, touched, values }) => (
                                                                    <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                                                        <div className="flex flex-col sm:flex-row">
                                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                                <div>
                                                                                    <label htmlFor="firstname">{t('Name')}</label>
                                                                                    <Field name="firstname" id="firstname" type="text" className="form-input" />
                                                                                    {submitCount ? (
                                                                                        errors.firstname ? (
                                                                                            <div className="text-danger mt-1">{errors.firstname?.toString()}</div>
                                                                                        ) : (
                                                                                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="lastname">{t('Last Name')}</label>
                                                                                    <Field name="lastname" id="lastname" type="text" className="form-input" />
                                                                                    {submitCount ? (
                                                                                        errors.lastname ? (
                                                                                            <div className="text-danger mt-1">{errors.lastname?.toString()}</div>
                                                                                        ) : (
                                                                                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="telefonNo">{t('Telephone')}</label>
                                                                                    <Field name="telefonNo" type="text" id="telefonNo" placeholder={t('Enter Telephone')} className="form-input" />

                                                                                    {submitCount ? (
                                                                                        errors.telefonNo ? (
                                                                                            <div className="text-danger mt-1">{errors.telefonNo?.toString()}</div>
                                                                                        ) : (
                                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>

                                                                                <div>
                                                                                    <label htmlFor="Email">{t('Email')}</label>
                                                                                    <Field name="email" type="text" id="Email" placeholder={t('Enter Email')} className="form-input" />

                                                                                    {submitCount ? errors.email ? <div className="text-danger mt-1">{errors.email?.toString()}</div> : <div className="text-success mt-1">{t('Looks Good!')}</div> : ''}
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="tcNumber">{t('TC Number')}</label>
                                                                                    <Field name="tcNumber" type="text" id="tcNumber" placeholder={t('Enter TC Number')} className="form-input" />

                                                                                    {submitCount ? (
                                                                                        errors.tcNumber ? (
                                                                                            <div className="text-danger mt-1">{errors.tcNumber?.toString()}</div>
                                                                                        ) : (
                                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                                <div>
                                                                                        <label htmlFor="hesapFirmaYetkisi">{t('Account Company Authorization')}</label>
                                                                                        <Select
                                                                                            id="hesapFirmaYetkisi"
                                                                                            options={optionsFirmaKullanıcıYetkis}
                                                                                            isSearchable={false}
                                                                                            defaultValue={optionsFirmaKullanıcıYetkis.find(optionsFirmaKullanıcıYetkis => optionsFirmaKullanıcıYetkis.value === selectedUser?.hesapFirmaYetkisi)}
                                                                                            onChange={(selectedOption) => {
                                                                                                if (!selectedUser) return; // Prevents null errors

                                                                                                setSelectedUser((prev) => ({
                                                                                                    ...(prev as UserData), // Ensures full UserData type
                                                                                                    hesapFirmaYetkisi: selectedOption!.value
                                                                                                }));
                                                                                            }}
                                                                                        />

                                                                                    </div>
                                                                                    <div>
                                                                                        <label htmlFor="hesapDurumu">{t('Account Status')}</label>
                                                                                        <Select
                                                                                            id="hesapDurumu"
                                                                                            options={statusOptions}
                                                                                            isSearchable={false}
                                                                                            defaultValue={statusOptions.find(option => option.value === selectedUser?.hesapDurumu)}
                                                                                            onChange={(selectedOption) => {
                                                                                                if (!selectedUser) return; // Prevents null errors

                                                                                                setSelectedUser((prev) => ({
                                                                                                    ...(prev as UserData), // Ensures full UserData structure is kept
                                                                                                    hesapDurumu: selectedOption!.value
                                                                                                }));
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="password">{t('Password')}</label>
                                                                                    <Field name="password" type="password" id="password" placeholder={t('Enter Password')} className="form-input" />

                                                                                    {submitCount ? (
                                                                                        errors.password ? (
                                                                                            <div className="text-danger mt-1">{errors.password}</div>
                                                                                        ) : (
                                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="confirmPassword">{t('Confirm Password')}</label>
                                                                                    <Field name="confirmPassword" type="password" id="confirmPassword" placeholder={t('Enter Password')} className="form-input" />

                                                                                    {submitCount ? (
                                                                                        errors.confirmPassword ? (
                                                                                            <div className="text-danger mt-1">{errors.confirmPassword}</div>
                                                                                        ) : (
                                                                                            <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                                                        )
                                                                                    ) : (
                                                                                        ''
                                                                                    )}
                                                                                </div>
                                                                                <div className="sm:col-span-2 mt-3">
                                                                                <button
                                                                                        type="submit"
                                                                                        className="btn btn-primary !mt-6"
                                                                                        onClick={() => {
                                                                                            console.log(Object.keys(errors));
                                                                                            if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                                                                submitUpdateFarmUserForm(values);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {t('Save')}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Form>)}
                                                                </Formik>
                                                            </div>
                                                            </Dialog.Panel>
                                                          </div>
                                                        </div>
                                                      </Dialog>
                                                    </Transition>
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
                    </div>
                ) : (
                    ''
                )}
                {tabs === 'manage-payment' ? (
                    <div className="switch">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="panel space-y-5">
                            <h5 className="font-semibold text-lg mb-4">{t('Payment Methods')}</h5>
                            <p>{t('Manage the payment methods')}</p>
                            <button
                            onClick={() => {setisVisibleOdemeBilgileri(!isVisibleOdemeBilgileri); isVisibleOdemeler && setisVisibleOdemeler(!isVisibleOdemeler);}}
                            className="btn btn-secondary">{t('Manage')}</button>
                        </div>
                        <div className="panel space-y-5">
                            <h5 className="font-semibold text-lg mb-4">{t('Bill Info')}</h5>
                            <p>{t('Manage the bill info.')}</p>
                            <button
                            onClick={() => {setisVisibleOdemeler(!isVisibleOdemeler); isVisibleOdemeBilgileri && setisVisibleOdemeBilgileri(!isVisibleOdemeBilgileri);}}
                            className="btn btn-primary">{t('Manage')}</button>
                        </div>
                    </div>
                    {isVisibleOdemeBilgileri && 
                    <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black panel mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                            <div className="panel">
                                <div className="mb-5">
                                    <h5 className="font-semibold text-lg mb-4">{t('Billing Address')}</h5>
                                </div>
                                <div className="mb-5">
                                    <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                        <div className="flex items-start justify-between py-3">
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                Address #1
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">2249 Caynor Circle, New Brunswick, New Jersey</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                        <div className="flex items-start justify-between py-3">
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                Address #2
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">4262 Leverton Cove Road, Springfield, Massachusetts</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-start justify-between py-3">
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                Address #3
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">2692 Berkshire Circle, Knoxville, Tennessee</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="panel">
                                <div className="mb-5">
                                    <h5 className="font-semibold text-lg mb-4">{t('Payment Methods')}</h5>
                                </div>
                                <div className="mb-5">
                                    <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                        <div className="flex items-start justify-between py-3">
                                            <div className="flex-none ltr:mr-4 rtl:ml-4">
                                                <img src="/assets/images/card-americanexpress.svg" alt="img" />
                                            </div>
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                Mastercard
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">XXXX XXXX XXXX 9704</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                        <div className="flex items-start justify-between py-3">
                                            <div className="flex-none ltr:mr-4 rtl:ml-4">
                                                <img src="/assets/images/card-mastercard.svg" alt="img" />
                                            </div>
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                American Express
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">XXXX XXXX XXXX 310</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-start justify-between py-3">
                                            <div className="flex-none ltr:mr-4 rtl:ml-4">
                                                <img src="/assets/images/card-visa.svg" alt="img" />
                                            </div>
                                            <h6 className="text-[#515365] font-bold dark:text-white-dark text-[15px]">
                                                Visa
                                                <span className="block text-white-dark dark:text-white-light font-normal text-xs mt-1">XXXX XXXX XXXX 5264</span>
                                            </h6>
                                            <div className="flex items-start justify-between ltr:ml-auto rtl:mr-auto">
                                                <button className="btn btn-dark">{t('Edit')}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                    {isVisibleOdemeler && 
                        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black panel mt-6">
                        <div className="invoice-table">
                            <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                                <div className="flex items-center gap-2">
                                    <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
                                        <IconTrashLines />
                                        {t('Delete')}
                                    </button>
                                    <Link to="/admin/FaturaDetay" className="btn btn-primary gap-2">
                                        <IconPlus />
                                        {t('Add New')}
                                    </Link>
                                </div>
                                <div className="ltr:ml-auto rtl:mr-auto">
                                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                            </div>
            
                            <div className="datatables pagination-padding">
                                <DataTable
                                    className="whitespace-nowrap table-hover invoice-table"
                                    records={recordsBillList}
                                    columns={[
                                        {
                                            accessor: 'invoice',
                                            title: t('Invoice'),
                                            sortable: true,
                                            render: ({ invoice }) => (
                                                <NavLink to="/apps/invoice/preview">
                                                    <div className="text-primary underline hover:no-underline font-semibold">{`#${invoice}`}</div>
                                                </NavLink>
                                            ),
                                        },
                                        {
                                            accessor: 'name',
                                            sortable: true,
                                            title: t('Name'),
                                            render: ({ name, id }) => (
                                                <div className="flex items-center font-semibold">
                                                    <div className="p-0.5 bg-white-dark/30 rounded-full w-max ltr:mr-2 rtl:ml-2">
                                                        <img className="h-8 w-8 rounded-full object-cover" src={`/assets/images/profile-${id}.jpeg`} alt="" />
                                                    </div>
                                                    <div>{name}</div>
                                                </div>
                                            ),
                                        },
                                        {
                                            accessor: 'email',
                                            title: t('Email'),
                                            sortable: true,
                                        },
                                        {
                                            accessor: 'date',
                                            title: t('Date'),
                                            sortable: true,
                                        },
                                        {
                                            accessor: 'amount',
                                            title: t('Amount'),
                                            sortable: true,
                                            titleClassName: 'text-right',
                                            render: ({ amount, id }) => <div className="text-right font-semibold">{`$${amount}`}</div>,
                                        },
                                        {
                                            accessor: 'status',
                                            title: t('Status'),
                                            sortable: true,
                                            render: ({ status }) => <span className={`badge badge-outline-${status.color} `}>{status.tooltip}</span>,
                                        },
                                        {
                                            accessor: 'action',
                                            title: t('Actions'),
                                            sortable: false,
                                            textAlignment: 'center',
                                            render: ({ id }) => (
                                                <div className="flex gap-4 items-center w-max mx-auto">
                                                    <NavLink to="/apps/invoice/edit" className="flex hover:text-info">
                                                        <IconEdit className="w-4.5 h-4.5" />
                                                    </NavLink>
                                                    <NavLink to="/apps/invoice/preview" className="flex hover:text-primary">
                                                        <IconEye />
                                                    </NavLink>
                                                    {/* <NavLink to="" className="flex"> */}
                                                    <button type="button" className="flex hover:text-danger" onClick={(e) => deleteRow(id)}>
                                                        <IconTrashLines />
                                                    </button>
                                                    {/* </NavLink> */}
                                                </div>
                                            ),
                                        },
                                    ]}
                                    highlightOnHover
                                    totalRecords={initialRecordsBillList.length}
                                    recordsPerPage={pageSizeBillList}
                                    page={pageBillList}
                                    onPageChange={(p) => setPageBillList(p)}
                                    recordsPerPageOptions={PAGE_SIZES}
                                    onRecordsPerPageChange={setPageSizeBillList}
                                    sortStatus={sortStatus}
                                    onSortStatusChange={setSortStatus}
                                    selectedRecords={selectedRecordsBillList}
                                    onSelectedRecordsChange={setSelectedRecordsBillList}
                                    paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                                />
                            </div>
                        </div>
                    </div>
                    }
                    </div>

                    
                ) : (
                    null
                )}
                {tabs === 'danger-zone' ? (
                    <div className="switch">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Activate Account')}</h5>
                                <p>{t('Activate everything related to the account')}</p>
                                <button onClick={() => setHesapAktifleştir(true)} className="btn btn-success btn-delete-account">{t('Deactivate Account')}</button>
                                <Transition appear show={hesapAktifleştir} as={Fragment}>
                                <Dialog as="div" open={hesapAktifleştir} onClose={() => setHesapAktifleştir(false)}>
                                    <TransitionChild
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="fixed inset-0" />
                                    </TransitionChild>
                                    <div id="slideIn_down_modal" className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                                        <div className="flex items-start justify-center min-h-screen px-4">
                                            <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark animate__animated animate__slideInDown">
                                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                                    <h5 className="font-bold text-lg">{t('Activate Account')}</h5>
                                                </div>
                                                <div className="p-5">
                                                    <p>
                                                        {t('When a company account is activated, all related data associated with that company is also activated. This includes all user accounts (such as admin, farmer, supplier, etc.) linked to the company, which become active and visible in the system. Additionally, all relevant data tied to these users (e.g., applications, permissions, roles) will also be available for use by the system.')}
                                                    </p>
                                                    <div className="flex justify-end items-center mt-8">
                                                        <button onClick={() => setHesapAktifleştir(false)} type="button" className="btn btn-outline-danger">
                                                            {t('Cancel')}
                                                        </button>
                                                        <button onClick={() => setHesapAktifleştir(false)} type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                            {t('Accept')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </DialogPanel>
                                        </div>
                                    </div>
                                </Dialog>
                            </Transition>
                            </div>
                            <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Deactivate Account')}</h5>
                                <p>{t('The account will be switched to inactive status and after switching to inactive status, it is necessary to apply for activation again.')}</p>
                                <button onClick={() => setHesapDondur(true)} className="btn btn-warning btn-delete-account">{t('Deactivate Account')}</button>
                                <Transition appear show={hesapDondur} as={Fragment}>
                                <Dialog as="div" open={hesapDondur} onClose={() => setHesapDondur(false)}>
                                    <TransitionChild
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="fixed inset-0" />
                                    </TransitionChild>
                                    <div id="slideIn_down_modal" className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                                        <div className="flex items-start justify-center min-h-screen px-4">
                                            <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark animate__animated animate__slideInDown">
                                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                                    <h5 className="font-bold text-lg">{t('Account Deactivation')}</h5>
                                                </div>
                                                <div className="p-5">
                                                    <p>
                                                        {t('This action will initiate the account deactivation process. The account will be set to inactive, and an activation request will be required to reactivate it. A deactivated user will not receive notifications and will appear as inactive in the system.')}
                                                    </p>
                                                    <div className="flex justify-end items-center mt-8">
                                                        <button onClick={() => setHesapDondur(false)} type="button" className="btn btn-outline-danger">
                                                            {t('Cancel')}
                                                        </button>
                                                        <button onClick={() => setHesapDondur(false)} type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                            {t('Accept')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </DialogPanel>
                                        </div>
                                    </div>
                                </Dialog>
                            </Transition>
                            </div>
                            <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Pasive Account')}</h5>
                                <p>{t('Account Set Passive')}</p>
                                <button onClick={() => setHesapPasif(true)} className="btn btn-danger btn-delete-account">{t('Pasive Account')}</button>
                                <Transition appear show={hesapPasif} as={Fragment}>
                                <Dialog as="div" open={hesapPasif} onClose={() => setHesapPasif(false)}>
                                    <TransitionChild
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="fixed inset-0" />
                                    </TransitionChild>
                                    <div id="slideIn_down_modal" className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                                        <div className="flex items-start justify-center min-h-screen px-4">
                                            <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark animate__animated animate__slideInDown">
                                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                                    <h5 className="font-bold text-lg">{t('Account Set Passive')}</h5>
                                                </div>
                                                <div className="p-5">
                                                    <p>
                                                        {t('This action will initiate account pasive. The same actions applied to groups will apply to this account.')}
                                                    </p>
                                                    <div className="flex justify-end items-center mt-8">
                                                        <button onClick={() => setHesapPasif(false)} type="button" className="btn btn-outline-danger">
                                                            {t('Cancel')}
                                                        </button>
                                                        <button onClick={() => setHesapPasif(false)} type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                            {t('Accept')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </DialogPanel>
                                        </div>
                                    </div>
                                </Dialog>
                            </Transition>
                            </div>
                        </div>
                        <div className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black panel mt-6">
                        <div className="panel space-y-5 gap-5 text-center">
                                <h5 className="font-semibold text-lg mb-4">{t('Delete Account')}</h5>
                                <p>{t('Once you delete the account, there is no going back. Please be certain.')}</p>
                                <button onClick={() => setHesapSil(true)} className="btn btn-danger btn-delete-account justify-self-center">{t('Delete Account')}</button>
                                <Transition appear show={hesapSil} as={Fragment}>
                                <Dialog as="div" open={hesapSil} onClose={() => setHesapSil(false)}>
                                    <TransitionChild
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="fixed inset-0" />
                                    </TransitionChild>
                                    <div id="slideIn_down_modal" className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                                        <div className="flex items-start justify-center min-h-screen px-4">
                                            <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark animate__animated animate__slideInDown">
                                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                                    <h5 className="font-bold text-lg">{t('Account Deletion Process')}</h5>
                                                </div>
                                                <div className="p-5">
                                                    <p>
                                                        {t('This action will initiate account deletion. The same actions applied to groups will apply to this account. Once the account has been deleted, it cannot be restored. Please make sure to perform the action carefully and confirm.')}
                                                    </p>
                                                    <div className="flex justify-end items-center mt-8">
                                                        <button onClick={() => setHesapSil(false)} type="button" className="btn btn-outline-danger">
                                                            {t('Cancel')}
                                                        </button>
                                                        <button onClick={() => setHesapSil(false)} type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                            {t('Accept')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </DialogPanel>
                                        </div>
                                    </div>
                                </Dialog>
                            </Transition>
                            </div>
                            </div>
                    </div>
                ) : (
                    ''
                )}

            </div>
        </div>
    );
};

export default AccountSetting;
 
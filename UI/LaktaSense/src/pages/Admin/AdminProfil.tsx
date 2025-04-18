import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useEffect, useState, Fragment } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconHome from '../../components/Icon/IconHome';
import IconDollarSignCircle from '../../components/Icon/IconDollarSignCircle';
import IconTrash from '../../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import Select, { SingleValue } from 'react-select';
import axios from 'axios';
import IconNotes from '../../components/Icon/IconNotes';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconX from '../../components/Icon/IconX';
import { strict } from 'assert';
import { padEnd } from 'lodash';
import IconPencilPaper from '../../components/Icon/IconPencilPaper';

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

    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [firmaInfo, setFirmaInfo] = useState<firmaInfo | undefined>(undefined);
    const [firmaInfoUsers, setFirmaInfoUsers] = useState<UserData[]>([]);
    const [cityOpitons, setCityOptions] = useState<OptionType[]>([]);
    const [districtOpitons, setDistrictOptions] = useState<OptionType[]>([]);
    const [hesapSil, setHesapSil] = useState(false);
    const [hesapDondur, setHesapDondur] = useState(false);
    const [ciftlikSil, setCiftlikSil] = useState(false);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [isVisibleCiftlikBilgi, setisVisibleCiftlikBilgi] = useState(false);
    const [isVisibleFirmaKullanici, setisVisibleFirmaKullanici] = useState(false);
    const [isVisibleFirmaKullaniciEkle, setisVisibleFirmaKullaniciEkle] = useState(false);
    const [search, setSearch] = useState('');
    const [initialRecords, setInitialRecords] = useState<UserData[]>([]);
    const [rowData, setRowData] = useState<UserData[]>([]);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [page, setPage] = useState(1);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modal22, setModal22] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'kullaniciID',
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
        const sortedData = sortBy(rowData, 'kullaniciID');
        setInitialRecords(sortedData);
    }, [rowData]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

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
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/firma/postFirmaKullanicilarGetir', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }),
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
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);
    useEffect(() => {
        dispatch(setPageTitle('Account Setting'));
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

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.post("http://localhost:3030/api/firma/postFirmaBilgileriGetir", {
              firmaID: userInfo.firmaID,
            });
            console.log(response.data);

            const firmaInfo = {
                firmaAdi: response.data.firmaAdi,
                telefonNo: response.data.telefonNo,
                firmaAdresi: response.data.firmaAdresi,
                sehirID: response.data.sehirID,
                ilceID: response.data.ilceID,
                bolge: response.data.bolge,
                hesapDurumu: response.data.hesapDurumu,
                firmaMail: response.data.firmaMail
            };
            setFirmaInfo(firmaInfo);
            getDistrictList(firmaInfo!.sehirID);
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

    const handleKullaniciEkle = () => {
       alert("Dev");
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

    return (
        <div>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Profile')} <span className="text-s bg-danger-dark-light rounded text-red-600 px-4 ltr:ml-8 rtl:ml-8">{t('Admin')}</span><span className="text-s badge badge-outline-primary px-4 ltr:ml-8 rtl:ml-8">{firmaInfo?.firmaAdi}</span></h5>
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
                            <IconNotes />
                            {t("Manage User")}
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
                    <div>
                        <Formik
                            initialValues={{
                                kullaniciID: userInfo.kullaniciID,
                                firstname:  userInfo.isim,
                                lastname: userInfo.soyisim,
                                tcNumber: userInfo.tcNo,
                                email: userInfo.eposta,
                                telefonNo: userInfo.telefonNo,
                                password: '',
                                confirmPassword:'',
                            }}
                            validationSchema={submitUserFormValidation}
                            onSubmit={() => {}}
                        >{({ errors, submitCount, touched, values }) => (
                            <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                <h6 className="text-lg font-bold mb-5">{t('General Information')}</h6>
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
                                                {(() => {
                                                    if (userInfo.hesapFirmaYetkisi === 'a') {
                                                        return <span id="hesapFirmaYetkisi" className="badge bg-success text-lg block mx-auto text-center">Admin</span>;
                                                    } else if (userInfo.hesapFirmaYetkisi === 'k')  {
                                                        return <span id="hesapFirmaYetkisi"  className="badge bg-primary text-lg block mx-auto text-center">{t('User')}</span>;
                                                    } else {
                                                        return <span id="hesapFirmaYetkisi"  className="badge bg-dark text-lg block mx-auto text-center">NaN</span>;; // Return nothing if no condition matches
                                                    }
                                                })()}
                                            </div>
                                            <div>
                                                <label htmlFor="hesapDurumu">{t('Account Status')}</label>
                                                {(() => {
                                                    if (userInfo.hesapDurumu === 'a') {
                                                        return <span id="hesapFirmaYetkisi" className="badge bg-success text-lg block mx-auto text-center">{t('Active')}</span>;
                                                    } else if (userInfo.hesapDurumu === 'p')  {
                                                        return <span id="hesapFirmaYetkisi"  className="badge bg-primary text-lg block mx-auto text-center">{t('Passive')}</span>;
                                                    } else if (userInfo.hesapDurumu === 'b')  {
                                                        return <span id="hesapFirmaYetkisi"  className="badge bg-warning text-lg block mx-auto text-center">{t('On hold')}</span>;
                                                    }else {
                                                        return <span id="hesapFirmaYetkisi"  className="badge bg-dark text-lg block mx-auto text-center">NaN</span>;; // Return nothing if no condition matches
                                                    }
                                                })()}
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
                                                        submitUpdateUserForm(values);
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
                ) : (
                    ''
                )}
                {tabs === 'manage-user' ? (
                    <div className="switch">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Manage Users')}</h5>
                                <p>{t('Manage admin users.')}</p>
                                <button
                                onClick={() => {setisVisibleFirmaKullanici(!isVisibleFirmaKullanici); isVisibleCiftlikBilgi && setisVisibleCiftlikBilgi(!isVisibleCiftlikBilgi);}}
                                className="btn btn-secondary">{t('Manage')}</button>
                            </div>
                            <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Bill Info')}</h5>
                                <p>{t('Manage the bill info.')}</p>
                                <button
                                onClick={() => {setisVisibleCiftlikBilgi(!isVisibleCiftlikBilgi); isVisibleFirmaKullanici && setisVisibleFirmaKullanici(!isVisibleFirmaKullanici);}}
                                className="btn btn-primary">{t('Manage')}</button>
                            </div>
                        </div>
                        {isVisibleCiftlikBilgi && <div>
                            <Formik
                                initialValues={{
                                    firmaAdi: firmaInfo?.firmaAdi,
                                    telefonNo: firmaInfo?.telefonNo,
                                    firmaAdresi: firmaInfo?.firmaAdresi,
                                    email: firmaInfo?.firmaMail,
                                    city: firmaInfo?.sehirID,
                                    district: firmaInfo?.ilceID,
                                }}
                                validationSchema={submitCompanyFormValidation}
                                onSubmit={() => {}}
                            >{({ errors, submitCount, touched, values }) => (
                                <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black panel mt-6">
                                    <h6 className="text-lg font-bold mb-5">{t('Bill Info')}</h6>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5" style={{ paddingTop: '1%'}}>
                                            <div>
                                                <label htmlFor="firmaAdi">{t('Company Name')}</label>
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
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5" style={{ paddingTop: '1%'}}>
                                            <div>
                                                <label htmlFor="firmaAdresi">{t('Address')}</label>
                                                <Field className="form-textarea" as="textarea" name="firmaAdresi" id="firmaAdresi" rows="3"  placeholder={t('Enter Address')} />
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
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ paddingTop: '1%'}}>
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
                                                        options={cityOpitons}
                                                />
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
                                                        options={values.city === null ? [{value: '', label: 'Please select a city first'}] : districtOpitons}
                                                />
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
                                                    }}
                                                >
                                                    {t('Save')}
                                                </button>
                                            </div>
                                        </div>
                                </Form>)}
                            </Formik>
                        </div>}
                        {isVisibleFirmaKullanici && <div>
                            <div className="panel mt-6">
                                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Admin Users')}</h5>
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
                                                                            isSearchable={false}                                                                            
                                                                            onChange={(selectedOption) => {
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
                        </div>}
                    </div>
                ) : (
                    ''
                )}
                {tabs === 'danger-zone' ? (
                    <div className="switch">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="panel space-y-5">
                                <h5 className="font-semibold text-lg mb-4">{t('Deactivate Account')}</h5>
                                <p>{t('The account will be switched to inactive status and after switching to inactive status, it is necessary to apply for activation again. (For Vacation)')}</p>
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
                                                        {t('This action will initiate the account deactivation process. The account will be set to inactive, and an activation request will be required to reactivate it. A deactivated user will not receive notifications and will appear as inactive in the system (For holidays).')}
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
                                <h5 className="font-semibold text-lg mb-4">{t('Delete Account')}</h5>
                                <p>{t('Once you delete the account, there is no going back. Please be certain.')}</p>
                                <button onClick={() => setHesapSil(true)} className="btn btn-danger btn-delete-account">{t('Delete my account')}</button>
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
                                                        {t('This action will initiate the account deletion process. The same processes applied to farms will also apply to this account, but the action requires approval from the farm admin. Once deleted, the account cannot be restored. Please make sure and confirm the action carefully.')}
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

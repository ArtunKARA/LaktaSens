import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { useEffect, useState } from 'react';
import Dropdown from '../../components/Dropdown';
import i18next, { changeLanguage } from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconInstagram from '../../components/Icon/IconInstagram';
import IconFacebookCircle from '../../components/Icon/IconFacebookCircle';
import IconTwitter from '../../components/Icon/IconTwitter';
import IconGoogle from '../../components/Icon/IconGoogle';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import router from '../../router';
import Select, { SingleValue } from 'react-select';
import axios from 'axios';
import { s } from '@fullcalendar/core/internal-common';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface CompanyDataAplication {
    Firstname: string;
    Lastname: string;
    TCNumber: string;
    Email: string;
    TelefonNo: string;

    FirmaTipi: string;
    CompanyName: string;
    FirmaTelefonNo: string;
    firmaAdresi: string;
    FirmaEmail: string;
    sehirID: string;
    ilceID: string;
    CompanyID: string;
}

const KayitSayfasi = () => {
    const [activeTab, setActiveTab] = useState(1); // 1: Kişisel, 2: Firma, 3: Onay
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [cityOpitons, setCityOptions] = useState<OptionType[]>([]);
    const [districtOpitons, setDistrictOptions] = useState<OptionType[]>([]);
    useEffect(() => {
        dispatch(setPageTitle('Register Boxed'));
        axios
            .get('http://localhost:3030/api/options/cityList')
            .then((response) => {
                const cityOpitons = response.data.map((city: any) => ({
                    value: city.ID,
                    label: city.SehirIlceMahalleAdi,
                }));
                setCityOptions(cityOpitons);
                console.log(cityOpitons);
            })
            .catch((error) => {
                console.error('Error fetching city options:', error);
            });
    }, []);
    const getDistrictList = (cityID: string) => {
        axios
            .get('http://localhost:3030/api/options/districtList?cityID=' + cityID)
            .then((response) => {
                const districtOptions = response.data.map((district: any) => ({
                    value: district.ID,
                    label: district.SehirIlceMahalleAdi,
                }));
                setDistrictOptions(districtOptions);
                console.log(districtOptions);
            })
            .catch((error) => {
                console.error('Error fetching district options:', error);
            });
    };

    const navigate = useNavigate();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };
    const [flag, setFlag] = useState(themeConfig.locale);

    const submitForm = async (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });

        try {
            const response = await axios.post('http://localhost:3030/api/login/postKayit', values); // Burayı kendi API endpoint'inle değiştir

            if (response.status === 200 || response.status === 201) {
                toast.fire({
                    icon: 'success',
                    title: 'Başvuru Başarı İle Alıdı',
                    padding: '10px 20px',
                });

                navigate('/login'); // başarıyla yönlendir
            } else {
                // İsteğin başarılı olmaması durumunda
                toast.fire({
                    icon: 'error',
                    title: 'Something went wrong, please try again',
                    padding: '10px 20px',
                });
            }
        } catch (error: any) {
            // Sunucu hatası veya bağlantı hatası durumunda
            toast.fire({
                icon: 'error',
                title: error.response?.data?.message || 'Registration failed',
                padding: '10px 20px',
            });
        }
    };

    const submitReaplyForm = async (values: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });

        try {
            const response = await axios.post('http://localhost:3030/api/login/postYenidenBasvuru', values); // Burayı kendi API endpoint'inle değiştir

            if (response.status === 200 || response.status === 201) {
                toast.fire({
                    icon: 'success',
                    title: 'Başvuru Başarı İle Alıdı',
                    padding: '10px 20px',
                });

                navigate('/login'); // başarıyla yönlendir
            } else {
                // İsteğin başarılı olmaması durumunda
                toast.fire({
                    icon: 'error',
                    title: 'Something went wrong, please try again',
                    padding: '10px 20px',
                });
            }
        } catch (error: any) {
            // Sunucu hatası veya bağlantı hatası durumunda
            toast.fire({
                icon: 'error',
                title: error.response?.data?.message || 'Registration failed',
                padding: '10px 20px',
            });
        }
    };

    const submitFormValidation = Yup.object().shape({
        firstname: Yup.string().required('Please fill the first name'),
        lastname: Yup.string().required('Please fill the last name'),
        tcNumber: Yup.string()
            .required('Please provide a valid TC Number')
            .matches(/^[1-9][0-9]{10}$/, 'TC Number must be 11 digits and cannot start with 0')
            .test('is-valid-tc', 'Invalid TC Number', (value) => {
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

        city: Yup.string().required('Please provide a valid city'),
        district: Yup.string().required('Please provide a valid District'),
        firmaEmail: Yup.string().email('Invalid email').required('Please fill the Email'),
        firmaTelefonNo: Yup.string().required('Please fill the telephone'),
        firmaAdi: Yup.string().required('Please fill Commpany Name'),
        firmaAdresi: Yup.string().required('Please fill Commpany Address'),
        agree: Yup.boolean().oneOf([true], 'You must accept the terms and conditions').required('You must accept the terms and conditions'),
        firmaTipi: Yup.string().required('Please provide a valid company type'),
    });

    interface OptionType {
        value: string;
        label: string;
    }

    const companyTypeOptions = [
        { value: 'c', label: t('Farm') },
        { value: 't', label: t('Supplier') },
    ];

    const CitySelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
            form.setFieldValue('district', '');
            getDistrictList(selectedOption ? selectedOption.value : '');
        };

        return (
            <Select
                options={options}
                value={options ? options.find((option) => option.value === field.value) : null}
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
                value={options ? options.find((option) => option.value === field.value) : null}
                onChange={handleChange}
                placeholder={t('Please select a city')}
                isSearchable={true}
                isClearable={true}
            />
        );
    };

    const location = useLocation();
    const firmaID = location.state?.FirmaID || null;
    const [CompanyDataAplication, setCompanyDataAplication] = useState<CompanyDataAplication>();
    useEffect(() => {
        if (firmaID != null) {
            axios
                .post('http://localhost:3030/api/login/postBasvuruBilgileri', {
                    firmaID: firmaID,
                })
                .then((response) => {
                    setCompanyDataAplication(response.data);
                    console.log(CompanyDataAplication);
                })
                .catch((error) => {
                    console.error('Error fetching reject options:', error);
                });
        }
    }, [firmaID]);

    //animasyon
    useEffect(() => {
        AOS.init({});
    }, []);

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/loginArkaPlan.jpg)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                

                <div className="absolute top-4 right-4 z-50">
                        <div className="dropdown">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                button={
                                    <>
                                        <div>
                                            <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
                                        </div>
                                        <div className="text-base font-bold uppercase">{flag}</div>
                                        <span className="shrink-0">
                                            <IconCaretDown />
                                        </span>
                                    </>
                                }
                            >
                                <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                    {themeConfig.languageList.map((item: any) => {
                                        return (
                                            <li key={item.code}>
                                                <button
                                                    type="button"
                                                    className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary bg-white' : ''}`}
                                                    onClick={() => {
                                                        i18next.changeLanguage(item.code);
                                                        // setFlag(item.code);
                                                        setLocale(item.code);
                                                    }}
                                                >
                                                    <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                    <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div
                        className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20"
                        data-aos="fade-right"
                        data-aos-duration="2000"
                    >
                        <div className="mx-auto w-full max-w-[600px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-green-600 md:text-3xl">{t('Sign Up')}</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">{t('Enter your personal information to register')}</p>
                            </div>
                            <div className="inline-block w-full mb-10">
                                <div className="relative z-[1]">
                                    <ul className="mb-5 grid grid-cols-3 text-center">
                                        <li>
                                            <div
                                                className={`${activeTab === 1 ? '!bg-green-700 text-white' : ''}
                block rounded-full bg-[#f3f2ee] p-2.5 dark:bg-[#1b2e4b]`}
                                                onClick={() => setActiveTab(1)}
                                            >
                                                Kişisel Bilgiler
                                            </div>
                                        </li>
                                        <li>
                                            <div
                                                className={`${activeTab === 2 ? '!bg-green-700 text-white' : ''}
                block rounded-full bg-[#f3f2ee] p-2.5 dark:bg-[#1b2e4b]`}
                                                onClick={() => setActiveTab(2)}
                                            >
                                                Şirket Bilgileri
                                            </div>
                                        </li>
                                        <li>
                                            <div
                                                className={`${activeTab === 3 ? '!bg-green-700 text-white' : ''}
                block rounded-full bg-[#f3f2ee] p-2.5 dark:bg-[#1b2e4b]`}
                                                onClick={() => setActiveTab(3)}
                                            >
                                                Onayla Ve Kayıt Ol
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <Formik
                                initialValues={{
                                    firmaID: CompanyDataAplication?.CompanyID || '',
                                    firstname: CompanyDataAplication?.Firstname || '',
                                    lastname: CompanyDataAplication?.Lastname || '',
                                    tcNumber: CompanyDataAplication?.TCNumber || '',
                                    email: CompanyDataAplication?.Email || '',
                                    telefonNo: CompanyDataAplication?.TelefonNo || '',
                                    password: '',
                                    confirmPassword: '',

                                    firmaTipi: CompanyDataAplication?.FirmaTipi || '',
                                    firmaAdi: CompanyDataAplication?.CompanyName || '',
                                    firmaTelefonNo: CompanyDataAplication?.FirmaTelefonNo || '',
                                    firmaAdresi: CompanyDataAplication?.firmaAdresi || '',
                                    firmaEmail: CompanyDataAplication?.FirmaEmail || '',
                                    city: CompanyDataAplication?.sehirID || '',
                                    district: CompanyDataAplication?.ilceID || '',

                                    agree: false,
                                }}
                                validationSchema={submitFormValidation}
                                enableReinitialize
                                onSubmit={() => {}}
                            >
                                {({ errors, submitCount, touched, values }) => (
                                    <Form className="space-y-5">
                                        {activeTab === 1 && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label htmlFor="firstname">{t('First Name')}</label>
                                                        <Field name="firstname" type="text" id="firstname" placeholder={t('Enter First Name')} className="form-input" />
                                                        {submitCount ? (
                                                            errors.firstname ? (
                                                                <div className="text-danger mt-1">{errors.firstname}</div>
                                                            ) : (
                                                                <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="lastname">{t('Last Name')}</label>
                                                        <Field name="lastname" type="text" id="lastname" placeholder={t('Enter Last Name')} className="form-input" />
                                                        {submitCount ? (
                                                            errors.lastname ? (
                                                                <div className="text-danger mt-1">{errors.lastname}</div>
                                                            ) : (
                                                                <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label htmlFor="tcNumber">{t('TC Number')}</label>
                                                        <Field name="tcNumber" type="text" id="tcNumber" placeholder={t('Enter TC Number')} className="form-input" />
                                                        {submitCount ? (
                                                            errors.tcNumber ? (
                                                                <div className="text-danger mt-1">{errors.tcNumber}</div>
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
                                                        {submitCount ? (
                                                            errors.email ? (
                                                                <div className="text-danger mt-1">{errors.email}</div>
                                                            ) : (
                                                                <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label htmlFor="telefonNo">{t('Telephone')}</label>
                                                        <Field name="telefonNo" type="text" id="telefonNo" placeholder={t('Enter Telephone Number')} className="form-input" />
                                                        {submitCount ? (
                                                            errors.telefonNo ? (
                                                                <div className="text-danger mt-1">{errors.telefonNo}</div>
                                                            ) : (
                                                                <div className="text-success mt-1">{t('Looks Good!')}</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                                </div>
                                            </>
                                        )}{' '}
                                        <div className="relative my-7 text-center md:mb-9 grid">
                                            <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                        </div>
                                        {activeTab === 2 && (
                                            <>
                                                <div className="mb-10">
                                                    <p className="text-base font-bold leading-normal text-white-dark">{t('Enter your commpany information to register')}</p>
                                                </div>
                                                <div>
                                                    <label htmlFor="hesapDurumu">{t('Company Type')}</label>
                                                    <Select
                                                        id="hesapDurumu"
                                                        options={companyTypeOptions}
                                                        isSearchable={false}
                                                        onChange={(selectedOption) => {
                                                            values.firmaTipi = selectedOption!.value;
                                                        }}
                                                    />
                                                    {submitCount ? (
                                                        errors.firmaTipi ? (
                                                            <div className="text-danger mt-1">{errors.firmaTipi}</div>
                                                        ) : (
                                                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                        )
                                                    ) : (
                                                        ''
                                                    )}
                                                </div>
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
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ paddingTop: '1%' }}>
                                                    <div>
                                                        <label htmlFor="firmaEmail">{t('Email')}</label>
                                                        <Field name="firmaEmail" type="text" id="firmaEmail" placeholder={t('Enter Email')} className="form-input" />

                                                        {submitCount ? (
                                                            errors.firmaEmail ? (
                                                                <div className="text-danger mt-1">{errors.firmaEmail}</div>
                                                            ) : (
                                                                <div className="text-success mt-1">Looks Good!</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="firmaTelefonNo">{t('Telephone')}</label>
                                                        <Field name="firmaTelefonNo" id="firmaTelefonNo" type="text" className="form-input" />
                                                        {submitCount ? (
                                                            errors.firmaTelefonNo ? (
                                                                <div className="text-danger mt-1">{errors.firmaTelefonNo}</div>
                                                            ) : (
                                                                <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                            )
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="form-group">
                                                        <label htmlFor="city">{t('City')}</label>
                                                        <Field name="city" component={CitySelect} options={cityOpitons} />
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
                                                            options={values.city.length == 0 ? [{ value: '', label: 'Please select a city first' }] : districtOpitons}
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
                                                </div>
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
                                            </>
                                        )}
                                        {activeTab === 3 && (
                                            <div className="space-y-4 text-black">
                                                <h3 className="text-xl font-bold mb-4">Girdiğiniz Bilgiler</h3>
                                                <div>
                                                    <strong>Ad Soyad:</strong> {values.firstname} {values.lastname}
                                                </div>
                                                <div>
                                                    <strong>TC:</strong> {values.tcNumber}
                                                </div>
                                                <div>
                                                    <strong>Email:</strong> {values.email}
                                                </div>
                                                <div>
                                                    <strong>Telefon:</strong> {values.telefonNo}
                                                </div>
                                                <div>
                                                    <strong>Tedarik Durumu:</strong> {values.firmaTipi}
                                                </div>
                                                <div>
                                                    <strong>Firma Adı:</strong> {values.firmaAdi}
                                                </div>
                                                <div>
                                                    <strong>Firma Email:</strong> {values.firmaEmail}
                                                </div>
                                                <div>
                                                    <strong>Telefon:</strong> {values.firmaTelefonNo}
                                                </div>
                                                <div>
                                                    <strong>Adres:</strong> {values.firmaAdresi}
                                                </div>
                                                <div>
                                                    <strong>Şehir / İlçe:</strong> {values.city} / {values.district}
                                                </div>
                                            </div>
                                        )}
                                        <div className={submitCount ? (errors.agree ? 'has-error' : 'has-success') : ''}>
                                            <div className="flex">
                                                <Field name="agree" id="agree" type="checkbox" className="form-checkbox" />
                                                {values.agree}
                                                <label htmlFor="agree" className="text-white-dark font-semibold">
                                                    {t('Agree to terms and conditions')}
                                                </label>
                                            </div>
                                            {submitCount ? errors.agree ? <div className="text-danger mt-1">{errors.agree}</div> : '' : ''}
                                        </div>
                                        {!firmaID ? (
                                            <button
                                                type="submit"
                                                className="btn btn-primary bg-green-700 border-green-500 !mt-6"
                                                onClick={() => {
                                                    console.log(Object.keys(errors));
                                                    if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                        submitForm(values);
                                                    }
                                                }}
                                            >
                                                {t('Submit Form')}
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                className="btn btn-primary bg-green-700 border-green-600a !mt-6"
                                                onClick={() => {
                                                    console.log(Object.keys(errors));
                                                    if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                        submitReaplyForm(values);
                                                    }
                                                }}
                                            >
                                                {t('Reapply')}
                                            </button>
                                        )}
                                    </Form>
                                )}
                            </Formik>
                            <div className="relative my-7 text-center md:mb-9">
                                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">{t('or')}</span>
                            </div>
                            <div className="text-center dark:text-white">
                                {t('Already have an account ?')}&nbsp;
                                <Link to="/login" className="uppercase text-green-600 underline transition hover:text-black dark:hover:text-white">
                                    {t('SIGN IN')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KayitSayfasi;

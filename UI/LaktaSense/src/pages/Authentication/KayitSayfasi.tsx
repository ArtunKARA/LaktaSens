import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { useEffect, useState } from 'react';
import Dropdown from '../../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconInstagram from '../../components/Icon/IconInstagram';
import IconFacebookCircle from '../../components/Icon/IconFacebookCircle';
import IconTwitter from '../../components/Icon/IconTwitter';
import IconGoogle from '../../components/Icon/IconGoogle';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import router from '../../router';
import { addDurations } from '@fullcalendar/core/internal';
import { add } from 'lodash';

const KayitSayfasi = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Register Boxed'));
    });
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


    const submitForm = () => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Form submitted successfully',
            padding: '10px 20px',
        });
        navigate("/cifci/dashboard");
    };
    const submitFormValidation = Yup.object().shape({
        firstname: Yup.string().required('Please fill the first name'),
        lastname: Yup.string().required('Please fill the last name'),
        username: Yup.string().required('Please choose a userName'),
        city: Yup.string().required('Please provide a valid city'),
        state: Yup.string().required('Please provide a valid state'),
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
        agree: Yup.bool().oneOf([true], 'You must agree before submitting.'),
    });

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
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
                        <div className="absolute top-6 end-6">
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
                                                        className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
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
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign Up</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email and password to register</p>
                            </div>
                                <Formik
                                    initialValues={{
                                        referenceType : '',
                                        firstname: 'Abuzettin',
                                        lastname: 'Kamyoncu',
                                        tcNumber: '',
                                        email: '',
                                        companyName: '',
                                        city: '',
                                        state: '',
                                        address: '',
                                        agree: false,
                                    }}
                                    validationSchema={submitFormValidation}
                                    onSubmit={() => {}}
                                >
                                    {({ errors, submitCount, touched, values }) => (
                                        <Form className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className={submitCount ? (errors.firstname ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="firstname">First Name </label>
                                                    <Field name="firstname" type="text" id="firstname" placeholder="Enter First Name" className="form-input" />

                                                    {submitCount ? (
                                                        errors.firstname ? (
                                                            <div className="text-danger mt-1">{errors.firstname}</div>
                                                        ) : (
                                                            <div className="text-success mt-1">Looks Good!</div>
                                                        )
                                                    ) : (
                                                        ''
                                                    )}
                                                </div>

                                                <div className={submitCount ? (errors.lastname ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="fullName">Last Name </label>
                                                    <Field name="lastname" type="text" id="lastname" placeholder="Enter Last Name" className="form-input" />

                                                    {submitCount ? errors.lastname ? <div className="text-danger mt-1">{errors.lastname}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className={submitCount ? (errors.tcNumber ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="tcNumber">TC Number </label>
                                                    <Field name="tcNumber" type="text" id="tcNumber" placeholder="Enter First Name" className="form-input" />

                                                    {submitCount ? (
                                                        errors.tcNumber ? (
                                                            <div className="text-danger mt-1">{errors.tcNumber}</div>
                                                        ) : (
                                                            <div className="text-success mt-1">Looks Good!</div>
                                                        )
                                                    ) : (
                                                        ''
                                                    )}
                                                </div>

                                                <div className={submitCount ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="Email">Email</label>
                                                    <Field name="email" type="text" id="Email" placeholder="Enter Email" className="form-input" />

                                                    {submitCount ? errors.email ? <div className="text-danger mt-1">{errors.email}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                                <div className={`md:col-span-2 ${submitCount ? (errors.city ? 'has-error' : 'has-success') : ''}`}>
                                                    <label htmlFor="customeCity">City</label>
                                                    <Field name="city" type="text" id="city" placeholder="Enter City" className="form-input" />

                                                    {submitCount ? errors.city ? <div className="text-danger mt-1">{errors.city}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                                </div>

                                                <div className={submitCount ? (errors.state ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="customeState">State</label>
                                                    <Field name="state" type="text" id="customeState" placeholder="Enter State" className="form-input" />
                                                    {submitCount ? errors.state ? <div className="text-danger mt-1">{errors.state}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                                </div>

                                                <div className={submitCount ? (errors.zip ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="customeZip">Zip</label>
                                                    <Field name="zip" type="text" id="customeZip" placeholder="Enter Zip" className="form-input" />
                                                    {submitCount ? errors.zip ? <div className="text-danger mt-1">{errors.zip}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                                </div>
                                            </div>

                                            <div className={submitCount ? (errors.agree ? 'has-error' : 'has-success') : ''}>
                                                <div className="flex">
                                                    <Field name="agree" id="agree" type="checkbox" className="form-checkbox" />
                                                    {values.agree}
                                                    <label htmlFor="agree" className="text-white-dark font-semibold">
                                                        Agree to terms and conditions
                                                    </label>
                                                </div>
                                                {submitCount ? errors.agree ? <div className="text-danger mt-1">{errors.agree}</div> : '' : ''}
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-primary !mt-6"
                                                onClick={() => {
                                                    if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                        submitForm();
                                                    }
                                                }}
                                            >
                                                Submit Form
                                            </button>
                                        </Form>
                                    )}
                                </Formik>                           
                            <div className="relative my-7 text-center md:mb-9">
                                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">or</span>
                            </div>
                            <div className="mb-10 md:mb-[60px]">
                                <ul className="flex justify-center gap-3.5 text-white">
                                    <li>
                                        <Link
                                            to="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconInstagram />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconFacebookCircle />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconTwitter fill={true} />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconGoogle />
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="text-center dark:text-white">
                                Already have an account ?&nbsp;
                                <Link to="/" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                    SIGN IN
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

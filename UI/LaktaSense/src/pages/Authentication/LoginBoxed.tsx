import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { useEffect, useState } from 'react';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';

const LoginBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Login Boxed'));
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

    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(''); // Hata mesajını sıfırla

        try {
            const response = await fetch('http://localhost:3030/api/login/giris', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, şifre: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Hata durumunda mesajı al ve state'e ata
                console.log(data)
                setErrorMessage(data.message || t('Email or password is incorrect.'));
                return;
            }
            console.log(data)
            // Kullanıcı bilgilerini kaydet
            const userInfo = {
                kullaniciID: data.kullaniciID,
                kullaniciTuru: data.kullaniciTuru,
                hesapDurumu: data.hesapDurumu,
                eposta: data.eposta,
                isim: data.isim,
                telefonNo: data.telefonNo,
                firmaID: data.firmaID
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            if(data.hesapDurumu == "a"){
                switch (data.kullaniciTuru) {
                    case "a":
                        
                        break;
                    case "c":
                        navigate('/cifci/dashboard');
                        break;
                    case "t":
                        
                        break;
                    default:
                        setErrorMessage(data.message || t('A type of user that does not exist.'));
                        break;
                }
            }else{
                setErrorMessage(data.message || t('Your account has been suspended.'));
            }
        } catch (error) {
            // İstek sırasında hata olursa mesajı ayarla
            setErrorMessage('A network error occurred. Please check your connection.');
        }
    };

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
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{t('Sign in')}</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">{t('Enter your email and password to login')}</p>
                            </div>
                            {/* Hata Mesajı */}
                            {errorMessage && (
                            <div className="flex items-center p-3.5 rounded text-white bg-gradient-to-r from-[#BD194D] to-[#004fe6]">
                                <span className="ltr:pr-2 rtl:pl-2">
                                    <strong className="ltr:mr-1 rtl:ml-1">{t('Warning !')}</strong> {errorMessage}
                                </span>
                                <button
                                    type="button"
                                    className="ltr:ml-auto rtl:mr-auto hover:opacity-80"
                                    onClick={() => setErrorMessage('')}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            )}
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">{t('Email')}</label>
                                    <div className="relative text-white-dark">
                                        <input id="Email" type="email" placeholder={t("Enter Email")} className="form-input ps-10 placeholder:text-white-dark" value={email} onChange={(e) => setEmail(e.target.value)}/>
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="Password">{t('Password')}</label>
                                    <div className="relative text-white-dark">
                                        <input id="Password" type="password" placeholder={t("Enter Password")} className="form-input ps-10 placeholder:text-white-dark" value={password} onChange={(e) => setPassword(e.target.value)}/>
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                                    {t('Sign in')}
                                </button>
                            </form>
                            <div className="relative my-7 text-center md:mb-9">
                                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">{t('or')}</span>
                            </div>
                            <div className="text-center dark:text-white">
                                {t('Don\'t have an account ?')}
                                <Link to="/register" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                    {t('SIGN UP')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;

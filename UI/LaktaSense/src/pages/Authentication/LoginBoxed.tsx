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
import AOS from 'aos';
import 'aos/dist/aos.css';

const LoginBoxed = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark');
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Login Boxed'));
    }, []);

    const setLocale = (flag: string) => {
        setFlag(flag);
        dispatch(toggleRTL(flag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const response = await fetch('http://localhost:3030/api/login/giris', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, şifre: password }),
            });
            const data = await response.json();

            if (!response.ok) return setErrorMessage(data.message || t('Email or password is incorrect.'));

            const userInfo = {
                kullaniciID: data.kullaniciID,
                kullaniciTuru: data.kullaniciTuru,
                hesapDurumu: data.hesapDurumu,
                hesapFirmaYetkisi: data.hesapFirmaYetkisi,
                eposta: data.eposta,
                isim: data.isim,
                soyisim: data.soyisim,
                telefonNo: data.telefonNo,
                tcNo: data.tcNo,
                firmaID: data.firmaID,
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            if (data.hesapDurumu === 'a' && data.firmaHesapDurumu === 'a') {
                switch (data.kullaniciTuru) {
                    case 'a':
                        return navigate('/admin/dashboard');
                    case 'c':
                        return navigate('/cifci/dashboard');
                    case 't':
                        return navigate('/tedarikci/dashboard');
                    default:
                        return setErrorMessage(t('A type of user that does not exist.'));
                }
            } else if (data.firmaHesapDurumu === 'b') {
                return navigate('/basvuruDurum', { state: { BasvuruDurum: data.firmaHesapDurumu } });
            } else if (data.firmaHesapDurumu === 'p') {
                return navigate('/basvuruDurum', { state: { BasvuruDurum: data.firmaHesapDurumu, FirmaID: data.firmaID } });
            } else {
                return setErrorMessage(data.message || t('Your account has been suspended.'));
            }
        } catch (err) {
            setErrorMessage(t('A network error occurred. Please check your connection.'));
        }
    };

    //animasyon

    useEffect(() => {
        AOS.init({});
    }, []);

    return (
        <div className="relative min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/images/auth/loginArkaPlan.jpg')" }}>
            {/* Dil seçimi */}
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
            {/* Kart */}
            <div className="flex items-center justify-center min-h-screen px-6" data-aos="fade-left" data-aos-duration="2000">
                <div className="w-full max-w-lg rounded-xl bg-white/70 backdrop-blur-md p-10 shadow-xl">
                    <h1 className="text-3xl font-bold text-center text-indigo-600">{t('Sign in')}</h1>
                    <p className="text-center text-gray-600 mb-8">{t('Enter your email and password to login')}</p>

                    {/* Hata mesajı */}
                    {errorMessage && <div className="mb-4 rounded bg-red-100 text-red-700 px-4 py-3 text-sm">{errorMessage}</div>}

                    {/* Giriş formu */}
                    <form className="space-y-5" onSubmit={submitForm}>
                        <div>
                            <label className="block mb-1 font-medium">{t('Email')}</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder={t('Enter Email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-10 py-2 border border-gray-300 rounded-md bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <IconMail />
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">{t('Password')}</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder={t('Enter Password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-10 py-2 border border-gray-300 rounded-md bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <IconLockDots />
                                </span>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 rounded-md text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition"
                        >
                            {t('Sign in')}
                        </button>
                    </form>

                    <div className="my-6 text-center text-sm text-gray-500">{t('or')}</div>

                    <div className="text-center text-sm">
                        {t("Don't have an account ?")}{' '}
                        <Link to="/register" className="text-indigo-600 font-semibold underline hover:text-indigo-800">
                            {t('SIGN UP')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;

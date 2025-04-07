import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useState } from 'react';
import themeConfig from '../../theme.config';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconMenuDashboard from '../../components/Icon/Menu/IconMenuDashboard';
import IconBellBing from '../../components/Icon/IconBellBing';
import IconMenuAuthentication from '../../components/Icon/Menu/IconMenuAuthentication';
import IconAirplay from '../../components/Icon/IconAirplay';



const BasvuruDurum = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Maintenance'));
        if(durum === "b"){
            setActiveTab4(2);
        }else if(durum === "p"){
            setActiveTab4(3);
        }
    });
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [activeTab4, setActiveTab4] = useState<any>(1);
    const [modal21, setModal21] = useState(false);
        const setLocale = (flag: string) => {
            setFlag(flag);
            if (flag.toLowerCase() === 'ae') {
                dispatch(toggleRTL('rtl'));
            } else {
                dispatch(toggleRTL('ltr'));
            }
        };
        const themeConfig = useSelector((state: IRootState) => state.themeConfig);

        const [flag, setFlag] = useState(themeConfig.locale);
        const { t } = useTranslation();
        const location = useLocation();
        const durum = location.state?.BasvuruDurum || 'Bilinmiyor';

        let baslık = "Under Maintenance";
        let renk = "text-blue-500";
        let mesaj1;
        let mesaj2a;
        let mesaj2b;
        let mesaj3a;
        let mesaj3b;
        let mesajAlt;

        if (durum === "b") {
            baslık = t('Application Under Review');
            renk = "text-yellow-500";

            mesaj1 = t('Application Under Review');
            mesaj2a = t('Your submission is currently under review.');
            mesaj2b = t('Our team is evaluating your details to ensure everything is in order.');
            mesaj3a = t('You will be notified once the review process is complete.');
            mesaj3b = t('Thank you for your patience and understanding.');
            mesajAlt = t('Use the navigation below to track your application progress.');

        }else if (durum === "p") {
            baslık = t('Application Rejected or Account Inactive');
            renk = "text-red-600";

            mesaj1 = t('We are sorry. Your account is currently inactive or your application has not been approved.');
            mesaj2a = t('Your information might not have met our application criteria.');
            mesaj2b = t('Alternatively, your account may have been deactivated later on.');
            mesaj3a = t('You can contact our support team for further clarification.');
            mesaj3b = t('We are here to assist you.');
            mesajAlt = t('Apply Again and Contact Support');
        }


    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div className="absolute top-6 end-6">
                <div className="dropdown">
                    <Dropdown
                        offset={[0, 8]}
                        placement={`${'bottom-end'}`}
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
            <div className="px-6 py-16 text-center font-semibold before:container before:absolute before:left-1/2 before:-translate-x-1/2 before:rounded-full before:bg-[linear-gradient(180deg,#4361EE_0%,rgba(67,97,238,0)_50.73%)] before:aspect-square before:opacity-10 md:py-20">
                <div className="relative">
                    <div className="-mt-8 font-semibold dark:text-white">
                        <h2 className={`mb-5 text-3xl font-bold md:text-5xl ${renk}`}>{baslık}</h2>
                        <h4 className="mb-7 text-xl sm:text-2xl">{mesaj1}</h4>
                        <p className="text-base">
                            {mesaj2a} <br className="hidden sm:block" />
                            {mesaj2b} <br />
                            <br />
                            {mesaj3a} <br />
                            {mesaj3b}  <br />
                            <br />
                        </p>
                    </div>
                    <div className="inline-block w-full px-6 py-16">
                    <div className="relative z-[1]">
                        <div
                            className={`${activeTab4 === 1 ? 'w-[15%]' : activeTab4 === 2 ? 'w-[48%]' : activeTab4 === 3 ? 'w-[81%]' : ''}
                            bg-primary w-[15%] h-1 absolute ltr:left-0 rtl:right-0 top-[30px] m-auto -z-[1] transition-[width]`}
                        ></div>
                        <ul className="mb-5 grid grid-cols-3">
                            <li className="mx-auto">
                                <button type="button"
                                    className={`${activeTab4 === 1 ? '!border-primary !bg-primary text-white' : ''}
                                    border-[3px] border-[#f3f2ee] bg-white dark:bg-[#253b5c] dark:border-[#1b2e4b] flex justify-center items-center w-16 h-16 rounded-full`}
                                >
                                   <IconBellBing />
                                </button>
                                <span className={`${activeTab4 === 1 ? 'text-primary ' : ''}text-center block mt-2`}>{t('Application')}</span>
                            </li>
                            <li className="mx-auto">
                                <button type="button"
                                    className={`${activeTab4 === 2 ? '!border-primary !bg-primary text-white' : ''}
                                    border-[3px] border-[#f3f2ee] bg-white dark:bg-[#253b5c] dark:border-[#1b2e4b] flex justify-center items-center w-16 h-16 rounded-full`}

                                >
                                    <IconMenuAuthentication />
                                </button>
                                <span className={`${activeTab4 === 2 ? 'text-primary ' : ''}text-center block mt-2`}>{t('Evaluation')}</span>
                            </li>
                            <li className="mx-auto">
                                <button type="button"
                                    className={`${activeTab4 === 3 ? '!border-primary !bg-primary text-white' : ''}
                                    border-[3px] border-[#f3f2ee] bg-white dark:bg-[#253b5c] dark:border-[#1b2e4b] flex justify-center items-center w-16 h-16 rounded-full`}
                                >
                                    <IconAirplay />
                                </button>
                                <span className={`${activeTab4 === 3 ? 'text-primary ' : ''}text-center block mt-2`}>{t('Result')}</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="mb-5">{activeTab4 === 1 && 'Try the keyboard navigation by clicking arrow left or right!'}</p>

                        <p className="mb-5">{activeTab4 === 2 && mesajAlt}</p>

                        <p className="mb-5">{activeTab4 === 3 && mesajAlt}</p>
                    </div>
                </div>
                    <button
                        type="button"
                        onClick={() => setModal21(false)}
                        className="btn btn-gradient mx-auto !mt-7 w-max border-0 uppercase shadow-none"
                        >
                        {t("Reapply")}
                    </button>
                    <Link to="/" className="btn btn-gradient mx-auto !mt-7 w-max border-0 uppercase shadow-none">
                        {t('Home')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BasvuruDurum;

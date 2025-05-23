import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMinus from '../Icon/IconMinus';
import IconMenuChat from '../Icon/Menu/IconMenuChat';
import IconMenuMailbox from '../Icon/Menu/IconMenuMailbox';
import IconMenuTodo from '../Icon/Menu/IconMenuTodo';
import IconMenuNotes from '../Icon/Menu/IconMenuNotes';
import IconMenuScrumboard from '../Icon/Menu/IconMenuScrumboard';
import IconMenuContacts from '../Icon/Menu/IconMenuContacts';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuCalendar from '../Icon/Menu/IconMenuCalendar';
import IconMenuComponents from '../Icon/Menu/IconMenuComponents';
import IconMenuElements from '../Icon/Menu/IconMenuElements';
import IconMenuCharts from '../Icon/Menu/IconMenuCharts';
import IconMenuWidgets from '../Icon/Menu/IconMenuWidgets';
import IconMenuFontIcons from '../Icon/Menu/IconMenuFontIcons';
import IconMenuDragAndDrop from '../Icon/Menu/IconMenuDragAndDrop';
import IconMenuTables from '../Icon/Menu/IconMenuTables';
import IconMenuDatatables from '../Icon/Menu/IconMenuDatatables';
import IconMenuForms from '../Icon/Menu/IconMenuForms';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconMenuPages from '../Icon/Menu/IconMenuPages';
import IconMenuAuthentication from '../Icon/Menu/IconMenuAuthentication';
import IconMenuDocumentation from '../Icon/Menu/IconMenuDocumentation';
import IconGithub from '../Icon/IconGithub';
import IconFolderMinus from '../Icon/IconFolderMinus';
import IconFolderPlus from '../Icon/IconFolderPlus';
import IconArchive from '../Icon/IconArchive';
import IconMinusCircle from '../Icon/IconMinusCircle';
import IconHelpCircle from '../Icon/IconHelpCircle';
import IconDollarSignCircle from '../Icon/IconDollarSignCircle';
import IconShoppingCart from '../Icon/IconShoppingCart';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/cifci/dashboard" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/laktasenselogo.png" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">{t('LaktaSens')}</span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="nav-item">
                                <li className="nav-item">
                                    <NavLink to="/cifci/dashboard" className="group">
                                        <div className="flex items-center">
                                            <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Main Menu')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'Analysis' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('Analysis')}>
                                        <div className="flex items-center">
                                            <IconGithub className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Analysis')}</span>
                                        </div>

                                        <div className={currentMenu !== 'Analysis' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'Analysis' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/">{t('Need Dev')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/">{t('Need Dev')}</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>{t('Cycle Tracking Module')}</span>
                                </h2>
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'Cycle Tracking' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('Cycle Tracking')}>
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Cycle Tracking')}</span>
                                        </div>

                                        <div className={currentMenu !== 'Cycle Tracking' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'Cycle Tracking' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/cifci/GenelTakip">{t('General Follow Up')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/SagmalTakip">{t('Milking')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/KuruTakip">{t('Dry')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/GebeTakip">{t('Pregnant')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/ServisTakip">{t('Service')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/YenidoganTakip">{t('Newborn')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/CikarilacaklarTakip">{t('Will Be Removed')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/InekEkle">{t('Add Cow')}</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>{t('Warehouse Tracking Module')}</span>
                                </h2>
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'Feed Analysis' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('Feed Analysis')}>
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Feed Analysis')}</span>
                                        </div>

                                        <div className={currentMenu !== 'Feed Analysis' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'Feed Analysis' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/cifci/yemAnaliz/IhtiyacAnalizi">{t('Needs Analysis')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/yemAnaliz/TedarikAnalizi">{t('Supply Analysis')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/yemAnaliz/TuketimAnalizi">{t('Consumption Analysis')}</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cifci/MalKabul" className="group">
                                        <div className="flex items-center">
                                            <IconFolderMinus className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Goods Receipt')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cifci/TuketimKaydi" className="group">
                                        <div className="flex items-center">
                                            <IconMinusCircle className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Consumption Record')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cifci/Sevk" className="group">
                                        <div className="flex items-center">
                                            <IconFolderPlus className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Dispatch')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="menu nav-item">
                                    <button
                                        type="button"
                                        className={`${currentMenu === t('Warehouse Tracking') ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu(t('Warehouse Tracking'))}
                                    >
                                        <div className="flex items-center">
                                            <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Warehouse Tracking')}</span>
                                        </div>

                                        <div className={currentMenu !== t('Warehouse Tracking') ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === t('Warehouse Tracking') ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/cifci/DepoTakip/Stok">{t('Stock')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/DepoTakip/Tüketim">{t('Consumption History')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/DepoTakip/MalKabul">{t('Goods Acceptance History')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/DepoTakip/Sevk">{t('Goods Dispatch History')}</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>{t('Supply Module')}</span>
                                </h2>
                                <li className="nav-item">
                                    <NavLink to="/" className="group">
                                        <div className="flex items-center">
                                            <IconMenuFontIcons className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Start a Tender')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/" className="group">
                                        <div className="flex items-center">
                                            <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Tender Tracking')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/" className="group">
                                        <div className="flex items-center">
                                            <IconShoppingCart className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Start a Order')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/" className="group">
                                        <div className="flex items-center">
                                            <IconMenuForms className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Order Tracking')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>{t('Sensor Tracking Module')}</span>
                                </h2>
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'Add Sensor' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('Add Sensor')}>
                                        <div className="flex items-center">
                                            <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Add Sensor')}</span>
                                        </div>

                                        <div className={currentMenu !== 'Add Sensor' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'Add Sensor' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/cifci/SensorEkle">{t('Add Leash Sensor')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/SensorEkle">{t('Add Warehouse Sensor')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/SensorEkle">{t('Add Milking Sensor')}</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/cifci/SensorEkle">{t('Add Barn Sensor')}</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cifci/DepoSensorTakip" className="group">
                                        <div className="flex items-center">
                                            <IconMenuCalendar className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Feed Warehouse Tracking')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cifci/AhirSensorTakip" className="group">
                                        <div className="flex items-center">
                                            <IconMenuCalendar className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Barn Tracking')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/" className="group">
                                        <div className="flex items-center">
                                            <IconMenuCalendar className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Milking Tracking')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;

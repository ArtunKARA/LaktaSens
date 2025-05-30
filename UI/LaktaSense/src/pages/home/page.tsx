import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/Dropdown';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import { IRootState } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import i18next from '../../i18n';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function LandingPage() {
    const { t, i18n } = useTranslation();
    const imagePath = i18n.language === 'tr' ? '/photo/diyagram2.png' : '/photo/en/diyagraming.png';
    const imagePath2 = i18n.language === 'tr' ? '/photo/ihale-modulu2.png' : '/photo/en/ihaleing.png';
    const imagePath3 = i18n.language === 'tr' ? '/photo/sagmal-dongu.png' : '/photo/en/sagmaldonguing.png';
    const imagePath4 = i18n.language === 'tr' ? '/photo/ahir-takip-modulu.png' : '/photo/en/ahırtakiping.png';
    const imagePath5 = i18n.language === 'tr' ? '/photo/feed-optimization.png' : '/photo/en/yeming.png';

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);
    const dispatch = useDispatch();
    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };

    useEffect(() => {
        AOS.init({});
    }, []);

    return (
        <div id="full-page" className="min-h-screen bg-gradient-to-br from-[#e0f7fa] to-[#e0f2f1] text-gray-800">
            <header className="w-full px-6 py-4 flex justify-between items-center shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <h1 className="text-2xl font-bold text-green-700">LaktaSens</h1>
                <nav className="flex items-center space-x-6">
                    <a href="login" className="hover:underline font-medium">
                        {t('Login')}
                    </a>
                    <a href="register" className="hover:underline font-medium">
                        {t('Register')}
                    </a>
                    <div>
                        <div className="dropdown">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="inline-flex items-center rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
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
                                    {themeConfig.languageList.map((item: any) => (
                                        <li key={item.code}>
                                            <button
                                                type="button"
                                                className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                onClick={() => {
                                                    i18next.changeLanguage(item.code);
                                                    setLocale(item.code);
                                                }}
                                            >
                                                <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </nav>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-4xl font-extrabold leading-tight mb-4">{t('Smart Milk Monitoring and Feed Optimization System for Small Farmers')}</h2>
                    <p className="text-lg mb-6">{t('LaktaSens increases efficiency in milk production while reducing feed costs through IoT-based sensors and algorithms.')}</p>
                    <button className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-2xl shadow-md flex items-center">
                        {t('Learn More')}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                </div>

                <div className="w-full h-96 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                    <img src="/photo/inek2.png" alt="LaktaSens Illustration" className="w-full h-full object-cover" />
                </div>
            </main>

            <section id="features" className="bg-white py-12 px-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                    {[
                        {
                            icon: '🍼',
                            title: t('Individual Milk Monitoring'),
                            description: t('Increase herd efficiency by collecting data from each cow.'),
                        },
                        {
                            icon: '📊',
                            title: t('Feed Optimization'),
                            description: t('Prevent feed waste with AI-powered algorithms.'),
                        },
                        {
                            icon: '🤝',
                            title: t('Local Supplier Bidding'),
                            description: t('Meet your feed needs with the best offers from local suppliers.'),
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-2xl shadow-md p-6 transition-all hover:shadow-xl hover:bg-white border border-gray-100">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="how-it-works" className="bg-[#f9fafb] px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left" data-aos="fade-right" data-aos-duration="2000">
                        <h2 className="text-3xl font-bold mb-4">{t('How It Works?')}</h2>
                        <p className="text-lg">{t('The process is fully digital with QR code matching, data collection via sensors, cloud transfer, and a decision support panel.')}</p>
                    </div>
                    <div className="flex justify-center" data-aos="fade-left" data-aos-duration="2000">
                        <img src={imagePath} alt="Workflow Diagram" className="max-w-[500px] w-full h-auto" />
                    </div>
                </div>
            </section>

            <section id="milking-cycle" className="bg-[#f9fafb] px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Sol: Fotoğraf */}
                    <div className="flex justify-center" data-aos="fade-left" data-aos-duration="2000">
                        <img src={imagePath3} alt="Milking Cycle Diagram" className="max-w-[300px] w-full h-auto" />
                    </div>

                    {/* Sağ: Açıklama */}
                    <div className="text-center md:text-left" data-aos="fade-right" data-aos-duration="2000">
                        <h2 className="text-3xl font-bold mb-4">{t('How Does the Milking Cycle Work?')}</h2>
                        <p className="text-lg leading-relaxed text-gray-700">
                            {t('The LaktaSens system fully digitalizes the entire process before and after milking:')}
                            <br />
                            <br />- 🐄 <strong>{t('Before Milking:')}</strong> {t('Animals are matched to sensors via QR codes.')}
                            <br />- 📈 <strong>{t('Data Collection:')}</strong> {t('Each cow’s milk yield is measured in real time during milking.')}
                            <br />- ☁️ <strong>{t('Data Transfer to Cloud:')}</strong> {t('Collected data is sent to the cloud server in real time.')}
                            <br />- 📊 <strong>{t('Decision Support:')}</strong> {t('Lactation analysis and feed optimization recommendations are generated.')}
                            <br />- 🔁 <strong>{t('Cycle Continuation:')}</strong> {t('Data is updated with each new milking and the system continues to learn.')}
                        </p>
                    </div>
                </div>
            </section>

            <section id="auction-module" className="bg-[#f9fafb] px-6 py-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Sol: Açıklama */}
                    <div className="text-center md:text-left" data-aos="fade-left" data-aos-duration="2000">
                        <h2 className="text-3xl font-bold mb-4">{t('How Does the Bidding Module Work?')}</h2>
                        <p className="text-lg leading-relaxed text-gray-700">
                            {t('The LaktaSens Bidding Module connects farmers with feed and other agricultural product suppliers through a smart system:')}
                            <br />
                            <br />- 📋 <strong>{t('Request Creation:')}</strong> {t('The farmer posts their need for feed, feed additives, or equipment through the application.')}
                            <br />- 📣 <strong>{t('Supplier Bids:')}</strong> {t('Local suppliers view the listing and submit their offers.')}
                            <br />- 🔍 <strong>{t('Transparent Comparison:')}</strong> {t('The farmer evaluates incoming offers based on criteria such as price, quality, and delivery time.')}
                            <br />- 🛒 <strong>{t('One-Click Purchase:')}</strong> {t('The farmer selects the best offer and completes the order.')}
                            <br />- ♻️ <strong>{t('Continuous Improvement:')}</strong> {t('The module analyzes past transactions and provides recommendations.')}
                        </p>
                    </div>
                    {/* Sağ: Fotoğraf */}
                    <div className="flex justify-center" data-aos="fade-right" data-aos-duration="2000">
                        <img src={imagePath2} alt="İhale Modülü Diyagramı" className="max-w-[500px] w-full h-auto" />
                    </div>
                </div>
            </section>

            <section id="barn-tracking" className="bg-[#f9fafb] px-6 py-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Sol: Fotoğraf */}
                    <div className="flex justify-center" data-aos="fade-left" data-aos-duration="2000">
                        <img src={imagePath5} alt="Barn Tracking Module Diagram" className="max-w-[500px] w-full h-auto" />
                    </div>

                    {/* Sağ: Açıklama */}
                    <div className="text-center md:text-left" data-aos="fade-right" data-aos-duration="2000">
                        <h2 className="text-3xl font-bold mb-4">{t('How Does the Barn Tracking Module Work?')}</h2>
                        <p className="text-lg leading-relaxed text-gray-700">
                            {t('The LaktaSens Barn Tracking Module digitalizes herd management, allowing farmers to monitor their animals more closely:')}
                            <br />
                            <br />- 🐮 <strong>{t('Identification: ')}</strong> {t('Each animal is registered in the system using a QR code.')}
                            <br />- 🔎 <strong>{t('Health Monitoring:')}</strong> {t('Cow-specific milk yield, lactation status, and health indicators are recorded.')}
                            <br />- 🗂️ <strong>{t('Historical Records:')}</strong> {t('All milking and feed consumption history is archived for each individual animal.')}
                            <br />- 📈 <strong>{t('Analysis and Alert System:')}</strong> {t('Irregularities are detected and alerts are sent to the farmer.')}
                            <br />- 🧠 <strong>{t('Decision Support:')}</strong> {t('The system provides herd-wide performance and cow-specific improvement recommendations.')}
                        </p>
                    </div>
                </div>
            </section>

            <section id="feed-optimization" className="bg-[#f9fafb] px-6 py-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Sol: Fotoğraf */}
                    <div className="flex justify-center" data-aos="fade-left" data-aos-duration="2000">
                        <img src={imagePath4} alt="Feed Requirement Determination" className="max-w-[500px] w-full h-auto" />
                    </div>

                    {/* Sağ: Açıklama */}
                    <div className="text-center md:text-left" data-aos="fade-right" data-aos-duration="2000">
                        <h2 className="text-3xl font-bold mb-4">{t('How is Cow-Specific Feed Requirement Determined?')}</h2>
                        <p className="text-lg leading-relaxed text-gray-700">
                            {t("The LaktaSens platform determines each cow's specific feed requirements based on its health status, milk yield, and lactation stage:")}
                            <br />
                            <br />- 🐄 <strong>{t('Individual Milking Data:')}</strong> {t('The amount and quality of milk collected during each milking are analyzed.')}
                            <br />- 📊 <strong>{t('Lactation Stage Analysis:')}</strong> {t('The nutritional needs of the cow change based on its lactation stage.')}
                            <br />- 🧬 <strong>{t('Health Indicators:')}</strong> {t('Body condition score, age, and disease history are included in the system.')}
                            <br />- ♻️ <strong>{t('Continuous Updating Plans:')}</strong> {t("Feed recommendations are dynamically updated based on the cow's performance.")}
                        </p>
                    </div>
                </div>
            </section>

            <section id="partners" className="bg-gradient-to-b from-[#f9fafb] to-white py-12 px-6">
                <div className="max-w-6xl mx-auto text-center" data-aos="fade-up" data-aos-duration="2000">
                    <h2 className="text-4xl font-extrabold text-gray-800">{t('Learn More About LaktaSens!')}</h2>

                    <div className="mt-8 text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{t('Join Us!')}</h3>
                        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                            {t("If you're a supplier, connect directly with farmers. If you're a farmer, smarten up your production process. Meet LaktaSens!")}
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg font-medium py-3 px-8 rounded-full shadow-lg transition duration-300"
                        >
                            <span>{t('Apply Now!')}</span>
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </section>

            <footer id="contact" className="bg-green-800 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto text-center" data-aos="fade-down" data-aos-duration="1000">
                    <h3 className="text-2xl font-bold mb-2">{t('Contact Us')}</h3>
                    <p className="mb-4">{t('For detailed information about the project, email: info@laktasens.com')}</p>
                    <p className="text-sm text-gray-300">© 2025 LaktaSens. {t('All rights reserved.')}</p>
                </div>
            </footer>
        </div>
    );
}

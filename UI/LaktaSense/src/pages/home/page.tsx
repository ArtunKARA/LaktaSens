import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import Dropdown from "../../components/Dropdown";
import IconCaretDown from "../../components/Icon/IconCaretDown";
import { IRootState } from "../../store";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import i18next from "../../i18n";



export default function LandingPage() {
    const { t } = useTranslation();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] to-[#e0f2f1] text-gray-800">
            <header className="w-full px-6 py-4 flex justify-between items-center shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <h1 className="text-2xl font-bold text-green-700">LaktaSens</h1>
                <nav className="flex items-center space-x-6">
                    <a href="login" className="hover:underline font-medium">{t('Login')}</a>
                    <a href="register" className="hover:underline font-medium">Kayıt Ol</a>
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
                    <h2 className="text-4xl font-extrabold leading-tight mb-4">
                        Küçük Çiftçiler İçin Akıllı Süt Takip ve Yem Optimizasyon Sistemi
                    </h2>
                    <p className="text-lg mb-6">
                        LaktaSens, IoT tabanlı sensörler ve algoritmalar ile süt üretiminde verimliliği artırırken yem maliyetlerini düşürür.
                    </p>
                    <button className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-2xl shadow-md flex items-center">
                        Daha Fazla Bilgi <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                </div>

                <div className="w-full h-96 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                    <img
                        src="/photo/inek2.png"
                        alt="LaktaSens Illustration"
                        className="w-full h-full object-cover"
                    />
                </div>
            </main>

            <section id="features" className="bg-white py-20 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                    {[
                        {
                            icon: "🍼",
                            title: "Bireysel Süt Takibi",
                            description:
                                "Her inekten alınan verilerle sürü verimliliğini artırın."
                        },
                        {
                            icon: "📊",
                            title: "Yem Optimizasyonu",
                            description:
                                "Yapay zekâ destekli algoritmalarla yem israfını önleyin."
                        },
                        {
                            icon: "🤝",
                            title: "Yerel Tedarik İhalesi",
                            description:
                                "Yem ihtiyacınızı yerel tedarikçilerden en uygun teklif ile karşılayın."
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


            <section id="how-it-works" className="bg-[#f9fafb] px-6 py-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="flex justify-center">
                        <img
                            src="/photo/diyagram2.png"
                            alt="Workflow Diagram"
                            className="max-w-[500px] w-full h-auto"
                        />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-4">Nasıl Çalışır?</h2>
                        <p className="text-lg">
                            QR kodlu eşleştirme, sensörle veri toplama, buluta aktarma ve karar destek paneli ile süreç tamamen dijital.
                        </p>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="bg-[#f9fafb] px-6 py-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-4">Nasıl Çalışır?</h2>
                        <p className="text-lg">
                            QR kodlu eşleştirme, sensörle veri toplama, buluta aktarma ve karar destek paneli ile süreç tamamen dijital.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <img
                            src="/photo/diyagram2.png"
                            alt="Workflow Diagram"
                            className="max-w-[500px] w-full h-auto"
                        />
                    </div>
                </div>
            </section>




            <section id="partners" className="bg-gradient-to-b from-[#f9fafb] to-white py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-extrabold text-gray-800">LaktaSens Hakkında Daha Fazla Şey Öğrenin!</h2>


                    <div className="mt-8 text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Sen de bize katıl!</h3>
                        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                            Tedarikçiysen çiftçilere doğrudan ulaş, çiftçiysen üretim sürecini akıllandır. LaktaSens ile tanış!
                        </p>
                        <a
                            href="/iletisim"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg font-medium py-3 px-8 rounded-full shadow-lg transition duration-300"
                        >
                            <span>Bilgi Al / Başvur</span>
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </section>




            <footer id="contact" className="bg-green-800 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h3 className="text-2xl font-bold mb-2">Bizimle İletişime Geçin</h3>
                    <p className="mb-4">Proje hakkında detaylı bilgi için e-posta: info@laktasens.com</p>
                    <p className="text-sm text-gray-300">© 2025 LaktaSens. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}
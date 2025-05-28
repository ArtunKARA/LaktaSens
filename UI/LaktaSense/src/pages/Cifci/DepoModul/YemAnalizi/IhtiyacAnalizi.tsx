import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../../../store';
import ReactApexChart from 'react-apexcharts';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../../../components/Dropdown';
import IconHome from '../../../../components/Icon/IconHome';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import IconHorizontalDots from '../../../../components/Icon/IconHorizontalDots';
import GenelHayvanDurumu from '../../../../components/YemAnalizi/GenelHayvanDurumu'; // Adjust the path if needed
import DongulereGoreIhtıyacAnalizi from '../../../../components/YemAnalizi/DongulereGoreIhtıyacAnalizi'; // Adjust the path if needed
import { divide } from 'lodash';
import IconChartSquare from '../../../../components/Icon/IconChartSquare';
import IconChatDot from '../../../../components/Icon/IconChatDot';
import IconBarChart from '../../../../components/Icon/IconBarChart';
import StokAnaliz from '../../../../components/YemDetay/StokAnaliz';
import TuketimAnaliz from '../../../../components/YemDetay/TuketimAnaliz';
import { Field, Form, Formik } from 'formik';
import Select, { SingleValue, StylesConfig } from 'react-select';
import IconSettings from '../../../../components/Icon/IconSettings';
import BesinKarsilama from '../../../../components/YemAnalizi/BesinKarsilama';

interface YemDepoTumUrunlerGecmisiAnaliz {
    yemID: number;
    yemAdi: string;
    durum: {
        zamanGrubu: string;
        depoStok: number;
    }[];
}
interface OptionType {
    value: string;
    label: string;
}

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Main Menu'));
    });
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [tabs, setTabs] = useState<string>('avarge');
    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const [loading] = useState(false);

    const [selectedFeed, setSelectedFeed] = useState<string | null>('');
    const [unitOpitons, setUnitOptions] = useState<OptionType[]>([]);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postStokListesi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                const formattedData = data.map((item: { yemID: string; yemAdi: string }) => ({
                    value: item.yemID,
                    label: item.yemAdi,
                }));
                setUnitOptions(formattedData);
                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    const menuStyles: StylesConfig<OptionType, false> = {
        // this ensures the portal’ed menu sits above everything else
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };
    return (
        <div>
            <GenelHayvanDurumu firmaID={userInfo.firmaID}></GenelHayvanDurumu>
            <div>
                <ul className="sm:flex font-semibold border-b border-[#ebedf2] dark:border-[#191e3a] mb-5 whitespace-nowrap overflow-y-auto">
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('avarge')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'avarge' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconBarChart />
                            {t('Analysis Based On Avarage Consumption')}
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('circular')}
                            className={`flex gap-2 p-4 border-b border-transparent hover:border-primary hover:text-primary ${tabs === 'circular' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconChartSquare />
                            {t('Consumption Analysis by Circular Animals')}
                        </button>
                    </li>
                </ul>
            </div>
            {tabs === 'avarge' ? (
                <div className="">
                    <div className="flex items-center mb-5">
                        <div className="flex-1">
                            <label htmlFor="yemID">{t('Feed Selection')}</label>
                            <Select
                                options={unitOpitons}
                                value={selectedFeed ? unitOpitons.find((option) => option.value === selectedFeed) : null}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                styles={menuStyles}
                                onChange={(selectedOption) => setSelectedFeed(selectedOption ? selectedOption.value : '')}
                                placeholder={t('Please Select')}
                                isSearchable={true}
                                isClearable={true}
                            />
                        </div>
                        <button type="button" className="btn btn-icon btn-light ml-2 mt-6">
                            <IconSettings />
                        </button>
                    </div>
                    <TuketimAnaliz yemID={selectedFeed} firmaID={userInfo.firmaID}></TuketimAnaliz>
                </div>
            ) : (
                ''
            )}
            {tabs === 'circular' ? (
                <div>
                    <DongulereGoreIhtıyacAnalizi></DongulereGoreIhtıyacAnalizi>
                    <BesinKarsilama></BesinKarsilama>
                </div>
            ) : (
                ''
            )}
        </div>
    );
};

export default Index;

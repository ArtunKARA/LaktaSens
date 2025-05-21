import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';

interface GenelHayvanDurumu {
    firmaID: number;
}

const GenelHayvanDurumu: React.FC<GenelHayvanDurumu> = ({ firmaID }) => {
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'yillik' | 'haftalik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [animalData, setAnimalData] = useState({
        dongudekiHayvanSayisi: 0,
        yavruHayvanSayisi: 0,
        kuruHayvanSayisi: 0,
        gebeHayvanSayisi: 0,
        sagmalHayvanSayisi: 0,
    });

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postHayvanSayisi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setAnimalData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    // Calculate percentages
    const calculatePercentages = () => {
        const total = animalData.dongudekiHayvanSayisi;

        // Percentages for all types based on dongudekiHayvanSayisi
        const dongudekiPercentage = total > 0 ? ((animalData.dongudekiHayvanSayisi / total) * 100).toFixed(2) : '0.00';
        const yavruPercentage = total > 0 ? ((animalData.yavruHayvanSayisi / total) * 100).toFixed(2) : '0.00';
        const kuruPercentage = total > 0 ? ((animalData.kuruHayvanSayisi / total) * 100).toFixed(2) : '0.00';
        const gebePercentage = total > 0 ? ((animalData.gebeHayvanSayisi / total) * 100).toFixed(2) : '0.00';
        const sagmalPercentage = total > 0 ? ((animalData.sagmalHayvanSayisi / total) * 100).toFixed(2) : '0.00';

        return {
            dongudekiPercentage,
            yavruPercentage,
            kuruPercentage,
            gebePercentage,
            sagmalPercentage,
        };
    };

    const percentages = calculatePercentages();

    return (
        <div>
            {' '}
            <div className="grid lg:grid-cols-1 gap-6 mb-6">
                <div className="px-3">
                    <div>
                        <div className="grid lg:grid-cols-1 gap-6 mb-6">
                            <div className="panel h-full p-0 lg:col-span-1">
                                <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b border-white-light dark:border-[#1b2e4b]">
                                    <h5 className="font-semibold text-lg">{t('Distribution of Animals')}</h5>
                                </div>

                                <div className="px-3 pb-5">
                                    {/* First row - Group 1 (Döngüdeki ve Yavru) occupying 1/3 of the space */}
                                    <div className="mb-6">
                                        <h6 className="font-medium mb-3 px-1 text-gray-500">{t('Total Distribution of Animals')}</h6>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Döngüdeki Hayvan */}
                                            <div className="panel bg-gradient-to-r from-emerald-500 to-teal-400 text-white">
                                                <div className="flex justify-between">
                                                    <div className="text-md font-semibold">{t('In Service Animal')}</div>
                                                </div>
                                                <div className="flex items-center mt-5">
                                                    <div className="text-3xl font-bold mr-3">{animalData.dongudekiHayvanSayisi}</div>
                                                    <div className="badge bg-white/30">{percentages.dongudekiPercentage}%</div>
                                                </div>
                                            </div>

                                            {/* Yavru Hayvan */}
                                            <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400 text-white">
                                                <div className="flex justify-between">
                                                    <div className="text-md font-semibold">{t('Newborn Animal')}</div>
                                                </div>
                                                <div className="flex items-center mt-5">
                                                    <div className="text-3xl font-bold mr-3">{animalData.yavruHayvanSayisi}</div>
                                                    <div className="badge bg-white/30">{percentages.yavruPercentage}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Second row - Group 2 (Kuru, Gebe, Sağmal) */}
                                    <div>
                                        <h6 className="font-medium mb-3 px-1 text-gray-500">{t('Animals Status')}</h6>
                                        <div className="grid grid-cols-3 gap-6 text-white">
                                            {/* Kuru Hayvan */}
                                            <div className="panel bg-gradient-to-r from-violet-500 to-violet-400">
                                                <div className="flex justify-between">
                                                    <div className="text-md font-semibold">{t('Dry Animal')}</div>
                                                </div>
                                                <div className="flex items-center mt-5">
                                                    <div className="text-3xl font-bold mr-3">{animalData.kuruHayvanSayisi}</div>
                                                    <div className="badge bg-white/30">{percentages.kuruPercentage}%</div>
                                                </div>
                                            </div>

                                            {/* Gebe Hayvan */}
                                            <div className="panel bg-gradient-to-r from-blue-500 to-blue-400">
                                                <div className="flex justify-between">
                                                    <div className="text-md font-semibold">{t('Pregnant Animal')}</div>
                                                </div>
                                                <div className="flex items-center mt-5">
                                                    <div className="text-3xl font-bold mr-3">{animalData.gebeHayvanSayisi}</div>
                                                    <div className="badge bg-white/30">{percentages.gebePercentage}%</div>
                                                </div>
                                            </div>

                                            {/* Sağmal Hayvan */}
                                            <div className="panel bg-gradient-to-r from-fuchsia-500 to-fuchsia-400">
                                                <div className="flex justify-between">
                                                    <div className="text-md font-semibold">{t('Milking Animal')}</div>
                                                </div>
                                                <div className="flex items-center mt-5">
                                                    <div className="text-3xl font-bold mr-3">{animalData.sagmalHayvanSayisi}</div>
                                                    <div className="badge bg-white/30">{percentages.sagmalPercentage}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenelHayvanDurumu;

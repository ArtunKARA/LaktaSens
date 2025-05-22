import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import IconCaretDown from '../Icon/IconCaretDown';
import { t } from 'i18next';
import ReactApexChart from 'react-apexcharts';
import IconHorizontalDots from '../Icon/IconHorizontalDots';
import { IRootState } from '../../store';
import { useSelector } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { ApexOptions } from 'apexcharts';
import IconPlus from '../Icon/IconPlus';
import IconCreditCard from '../Icon/IconCreditCard';

interface Row {
    kgPerInekGun: number;
    kgPerDay: number;
    inekCount: number;
}

const KPIKart: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'haftalik' | 'yillik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [raw, setRawData] = useState<Row>();
    const [days, setDays] = useState<number>(30);
    const [standartID, setStandartID] = useState<number>(1);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postKpiKgInekGun', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, days: days }),
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setRawData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
                setLoading(false); // Yükleme durumunu güncelle
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [days]);

    return (
        <div
            className="panel h-full overflow-hidden before:bg-[#1937cc] before:absolute before:-right-44 before:top-0 before:bottom-0 before:m-auto before:rounded-full before:w-96 before:h-96 grid grid-cols-1 content-between"
            style={{ background: 'linear-gradient(0deg,#00c6fb -227%,#005bea)' }}
        >
            <div className="flex items-center justify-between text-white-light z-[7] mb-6">
                <h5 className="font-semibold text-lg">{t('Feed KPI')}</h5>
                <div className="flex flex-col items-end">
                    <label htmlFor="days" className="mb-1 text-white font-medium text-sm">
                        {t('Number of Days')}
                    </label>
                    <input
                        id="days"
                        name="days"
                        type="number"
                        min="0"
                        max="100"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="rounded bg-[#1e3a8a] text-white px-3 py-1 border border-[#4361ee] focus:outline-none focus:ring-2 focus:ring-[#00c6fb] w-24"
                    />
                </div>
            </div>
            <div className="flex flex-col items-start text-white gap-4 pl-2 absolute left-4 z-10" style={{ top: '5.5rem' }}>
                <div className="flex items-center text-lg">
                    <span className="font-medium text-base mr-2">{t('kg / Cow / Day')}:</span>
                    <span className="text-2xl font-extrabold">{raw?.kgPerInekGun?.toFixed(2) ?? '-'}</span>
                </div>
                <div className="flex items-center text-lg">
                    <span className="font-medium text-base mr-2">{t('kg / Day')}:</span>
                    <span className="text-2xl font-extrabold">{raw?.kgPerDay?.toFixed(2) ?? '-'}</span>
                </div>
                <div className="flex items-center text-lg">
                    <span className="font-medium text-base mr-2">{t('Cow Count')}:</span>
                    <span className="text-2xl font-extrabold">{raw?.inekCount ?? '-'}</span>
                </div>
            </div>
        </div>
    );
};

export default KPIKart;

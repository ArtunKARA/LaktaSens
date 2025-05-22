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

interface Row {
    tipAdi: string;
    dailyNeedPerCow: number;
    deliveredPerCow: number;
}

const BesinKarsilama: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'haftalik' | 'yillik'>('aylik');
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [raw, setRawData] = useState<Row[]>([]);
    const [days, setDays] = useState<number>(30);
    const [standartID, setStandartID] = useState<number>(1);
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/cifci/depo/postBesinOran', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, days: days, standartID: standartID }),
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
    }, [days, standartID]);

    /* ---------- Veriyi Böl (within / excess) ----------------------------- */
    type Pt = { x: string; y: number; goals?: any[] };

    const withinPts: Pt[] = [];
    const excessPts: Pt[] = [];

    raw.forEach((r) => {
        const within = Math.min(r.deliveredPerCow, r.dailyNeedPerCow);
        const excess = Math.max(0, r.deliveredPerCow - r.dailyNeedPerCow);

        withinPts.push({
            x: r.tipAdi,
            y: within,
            goals: [
                {
                    name: 'Hedef',
                    value: r.dailyNeedPerCow,
                    strokeWidth: 4,
                    strokeColor: '#808080', // gri çizgi
                },
            ],
        });

        excessPts.push({
            x: r.tipAdi,
            y: excess, // 0 ise Apex bar çizmez
        });
    });

    /* ---------- Stacked Seriler ----------------------------------------- */
    const series: ApexAxisChartSeries = [
        { name: 'Hedefe kadar', data: withinPts }, // yeşil
        { name: 'Fazla', data: excessPts }, // sarı
    ];

    /* ---------- Opsiyonlar ---------------------------------------------- */
    const options: ApexOptions = {
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
            height: 380,
        },
        plotOptions: {
            bar: { horizontal: true, barHeight: '60%' },
        },
        colors: ['#27ae60', '#f1c40f'], // yeşil, sarı
        xaxis: {
            title: { text: t('kg / İnek / Gün') },
        },
        tooltip: {
            shared: true, // paylaşılmış → custom her seri için çağrılır
            intersect: false,
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                /* Yalnız ilk seri (index 0) için tooltip yaz; ötekilerde boş string döndür */
                if (seriesIndex !== 0) return '';

                // <== Bir kez render edilecek asıl içerik ==>
                const row = raw[dataPointIndex]; // satır verisi
                const goal = row.dailyNeedPerCow;
                const total = row.deliveredPerCow;
                const moreNeeded = Math.max(0, goal - total);
                const excess = Math.max(0, total - goal);
                const pct = ((total / goal) * 100).toFixed(1);

                return `
            <div style="padding:8px 10px; #ccc;">
                <strong>${row.tipAdi}</strong><br/>
                ${t('Actual')}: ${total} kg<br/>
                ${excess ? t('More') + `: <strong>+ ${excess} kg</strong><br/>` : ''}
                ${moreNeeded ? t('Required') + `: <strong>- ${moreNeeded} kg</strong><br/>` : ''}
                ${t('Goal')} ${goal} kg<br/>
                ${t('Meeting')}: <b>%${pct}</b>
            </div>`;
            },
        },
        legend: { show: false },
        dataLabels: { enabled: false },
    };

    return (
        <div className="panel h-full">
            <div className="flex items-center mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">{t('Rate of Meeting Nutritional Needs')}</h5>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ml-3">
                    <div>
                        <label htmlFor="select" className="block mb-1 font-medium">
                            {t('Standard Selection')}
                        </label>
                        <select id="select" className="form-select w-full" value={standartID} onChange={(e) => setStandartID(Number(e.target.value))}>
                            {[
                                { id: 1, label: 'Kuru' },
                                { id: 2, label: 'Gebelik' },
                                { id: 3, label: 'Sağmal' },
                                { id: 4, label: 'Yavru' },
                            ].map((item) => (
                                <option value={item.id} key={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="days" className="block mb-1 font-medium">
                            {t('Number of Days')}
                        </label>
                        <input id="days" name="days" type="number" className="form-input" min="0" max="100" value={days} onChange={(e) => setDays(Number(e.target.value))} />
                    </div>
                </div>
            </div>
            <div>
                <div className="bg-white dark:bg-black rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={series} options={options} type="bar" height={380} className="bg-white dark:bg-black rounded-lg" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BesinKarsilama;

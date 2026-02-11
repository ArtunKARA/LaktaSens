import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('AI Predictions')));
    });

    const forecastCards = [
        { label: '7 Günlük Süt Verimi', value: '23.4 L', note: 'Ortalama tahmin' },
        { label: '30 Günlük Süt Verimi', value: '24.1 L', note: 'Mevsimsel düzeltme' },
        { label: 'Haftalık Yem Tüketimi', value: '3.2 ton', note: 'Depo bazlı' },
    ];

    const forecastRows = [
        { metric: 'Süt Verimi', today: '22.9', seven: '23.4', thirty: '24.1' },
        { metric: 'Yem Tüketimi', today: '0.42', seven: '3.2', thirty: '13.1' },
        { metric: 'Kalite Skoru', today: '88', seven: '89', thirty: '90' },
        { metric: 'Brüt Gelir (TL)', today: '18.4K', seven: '129K', thirty: '540K' },
    ];

    return (
        <div>
            <div className="pt-5">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('AI Predictions')}</h5>
                    <p className="text-xs text-gray-500">{t('Demo Only')}</p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {forecastCards.map((card) => (
                        <div key={card.label} className="panel">
                            <div className="text-sm text-gray-500">{card.label}</div>
                            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                            <div className="mt-1 text-xs text-gray-500">{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Tahmin Detayı</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Metric')}</th>
                                    <th>{t('Today')}</th>
                                    <th>{t('7 Days')}</th>
                                    <th>{t('30 Days')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecastRows.map((row) => (
                                    <tr key={row.metric}>
                                        <td>{row.metric}</td>
                                        <td>{row.today}</td>
                                        <td>{row.seven}</td>
                                        <td>{row.thirty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;

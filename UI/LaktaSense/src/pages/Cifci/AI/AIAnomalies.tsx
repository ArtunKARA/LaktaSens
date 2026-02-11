import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('AI Anomalies')));
    });

    const anomalyCards = [
        { label: 'Verim düşüşü', value: '%9', note: '7 gün ortalaması' },
        { label: 'Sağım saati sapması', value: '40 dk', note: 'Son 2 gün' },
        { label: 'SCC artışı', value: '+%12', note: 'Mastitis riski' },
    ];

    const anomalies = [
        { date: '06.02.2026', anomaly: 'Soğuk zincir 1.5°C yüksek', priority: 'Kritik' },
        { date: '06.02.2026', anomaly: 'Yem tüketimi %12 düştü', priority: 'Yüksek' },
        { date: '05.02.2026', anomaly: 'Sağım saati 40 dk kaydı', priority: 'Orta' },
        { date: '05.02.2026', anomaly: 'Süt verimi %9 düştü', priority: 'Yüksek' },
    ];

    const priorityBadge = (priority: string) => {
        if (priority === 'Kritik') return 'badge bg-danger';
        if (priority === 'Yüksek') return 'badge bg-warning';
        if (priority === 'Orta') return 'badge bg-primary';
        return 'badge bg-success';
    };

    return (
        <div>
            <div className="pt-5">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('AI Anomalies')}</h5>
                    <p className="text-xs text-gray-500">{t('Demo Only')}</p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {anomalyCards.map((card) => (
                        <div key={card.label} className="panel">
                            <div className="text-sm text-gray-500">{card.label}</div>
                            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                            <div className="mt-1 text-xs text-gray-500">{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Tespit Edilen Anomaliler</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Date')}</th>
                                    <th>{t('Anomaly')}</th>
                                    <th>{t('Priority')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anomalies.map((item, index) => (
                                    <tr key={`${item.date}-${index}`}>
                                        <td>{item.date}</td>
                                        <td className="min-w-[260px]">{item.anomaly}</td>
                                        <td>
                                            <span className={priorityBadge(item.priority)}>{item.priority}</span>
                                        </td>
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

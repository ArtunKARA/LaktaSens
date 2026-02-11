import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('AI Recommendation Center')));
    });

    const recommendationCards = [
        { label: 'Yem enerji yoğunluğu +%5', value: 'Verim +%4', note: 'Yüksek öncelik' },
        { label: 'Sağım saati sabitlenmeli', value: 'Verim +%2', note: 'Orta öncelik' },
        { label: 'Soğuk zincir kontrolü', value: 'Kalite riski azalır', note: 'Kritik' },
    ];

    const recommendations = [
        { date: '06.02.2026', action: 'Yem karışımı güncelle', impact: 'Verim +%4', priority: 'Yüksek' },
        { date: '06.02.2026', action: 'Sağım saatini sabitle', impact: 'Verim +%2', priority: 'Orta' },
        { date: '06.02.2026', action: 'Soğuk zincir kontrolü (gece)', impact: 'Kalite', priority: 'Kritik' },
        { date: '05.02.2026', action: 'SCC takibi sıklaştır', impact: 'Sağlık', priority: 'Orta' },
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
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('AI Recommendation Center')}</h5>
                    <p className="text-xs text-gray-500">{t('Demo Only')}</p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {recommendationCards.map((card) => (
                        <div key={card.label} className="panel">
                            <div className="text-sm text-gray-500">{card.label}</div>
                            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                            <div className="mt-1 text-xs text-gray-500">{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Öneri Listesi</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Recommendation')}</th>
                                    <th>{t('Impact')}</th>
                                    <th>{t('Priority')}</th>
                                    <th>{t('Date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recommendations.map((item, index) => (
                                    <tr key={`${item.date}-${index}`}>
                                        <td className="min-w-[260px]">{item.action}</td>
                                        <td>{item.impact}</td>
                                        <td>
                                            <span className={priorityBadge(item.priority)}>{item.priority}</span>
                                        </td>
                                        <td>{item.date}</td>
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

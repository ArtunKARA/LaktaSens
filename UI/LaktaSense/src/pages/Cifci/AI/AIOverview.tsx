import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('AI Overview')));
    });

    const summaryCards = [
        { label: t('Total Anomalies'), value: '3', note: 'Son 7 gün' },
        { label: t('Critical Risk'), value: 'Soğuk zincir', note: 'Kalite riski' },
        { label: t('Recommendations This Week'), value: '5', note: 'Operasyon aksiyonları' },
        { label: t('Expected Yield'), value: '+%3', note: 'Önümüzdeki 7 gün' },
    ];

    const dailyNotes = [
        { date: '06.02.2026', note: 'Yem tüketimi dalgalı', priority: 'Orta' },
        { date: '06.02.2026', note: 'Sağım süresi uzadı', priority: 'Yüksek' },
        { date: '06.02.2026', note: 'Soğuk zincir sapması', priority: 'Kritik' },
        { date: '05.02.2026', note: 'SCC tahmini artış', priority: 'Orta' },
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
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('AI Overview')}</h5>
                    <p className="text-xs text-gray-500">{t('Demo Only')}</p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="panel">
                            <div className="text-sm text-gray-500">{card.label}</div>
                            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                            <div className="mt-1 text-xs text-gray-500">{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">{t('Daily AI Notes')}</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Date')}</th>
                                    <th>{t('Notes')}</th>
                                    <th>{t('Priority')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyNotes.map((item, index) => (
                                    <tr key={`${item.date}-${index}`}>
                                        <td>{item.date}</td>
                                        <td className="min-w-[260px]">{item.note}</td>
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

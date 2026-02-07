import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Index = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle(t('AI Risk Scores')));
    });

    const riskCards = [
        { label: 'Mastitis Riski', value: '68/100', note: 'Artış eğilimli' },
        { label: 'Kalite Riski', value: '72/100', note: 'Sabit' },
        { label: 'Verim Kaybı Riski', value: '55/100', note: 'Düşüş' },
    ];

    const riskRows = [
        { risk: 'Mastitis', score: '68', trend: 'Artış' },
        { risk: 'Kalite', score: '72', trend: 'Sabit' },
        { risk: 'Verim Kaybı', score: '55', trend: 'Düşüş' },
        { risk: 'Enerji Açığı', score: '41', trend: 'Sabit' },
    ];

    return (
        <div>
            <div className="pt-5">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('AI Risk Scores')}</h5>
                    <p className="text-xs text-gray-500">{t('Demo Only')}</p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {riskCards.map((card) => (
                        <div key={card.label} className="panel">
                            <div className="text-sm text-gray-500">{card.label}</div>
                            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                            <div className="mt-1 text-xs text-gray-500">{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <div className="flex items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Risk Tablosu</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>{t('Risk')}</th>
                                    <th>{t('Score')}</th>
                                    <th>{t('Trend')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskRows.map((row) => (
                                    <tr key={row.risk}>
                                        <td>{row.risk}</td>
                                        <td>{row.score}</td>
                                        <td>{row.trend}</td>
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

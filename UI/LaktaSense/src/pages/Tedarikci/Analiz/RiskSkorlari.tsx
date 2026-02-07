import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const RiskSkorlari = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Risk Skorları'));
    }, [dispatch]);

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('Risk Skorları')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Mastitis Riski')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Mastitis Riski: 68/100')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Kalite Riski')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Kalite Riski: 72/100')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Verim Kaybı Riski')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Verim Kaybı Riski: 55/100')}</div>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-4 text-lg font-semibold">{t('Risk Detayı')}</div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Risk')}</th>
                                <th>{t('Skor')}</th>
                                <th>{t('Trend')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t('Mastitis')}</td>
                                <td>68</td>
                                <td>{t('Artış')}</td>
                            </tr>
                            <tr>
                                <td>{t('Kalite')}</td>
                                <td>72</td>
                                <td>{t('Sabit')}</td>
                            </tr>
                            <tr>
                                <td>{t('Verim')}</td>
                                <td>55</td>
                                <td>{t('Düşüş')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">{t('Bu sayfa demo amaçlıdır.')}</p>
        </div>
    );
};

export default RiskSkorlari;

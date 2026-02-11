import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const AiGenelOzet = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('AI Genel Özet'));
    }, [dispatch]);

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('AI Genel Özet')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Toplam Anomali')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Toplam 3 anomali')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Kritik Risk')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Kritik risk: Soğuk zincir')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Öneri Sayısı')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Bu hafta öneri sayısı: 5')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Beklenen Verim')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Beklenen verim: +%3')}</div>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-4 text-lg font-semibold">{t('Günlük AI Notları')}</div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Tarih')}</th>
                                <th>{t('Not')}</th>
                                <th>{t('Öncelik')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>06.02.2026</td>
                                <td>{t('Yem tüketimi dalgalı')}</td>
                                <td>{t('Orta')}</td>
                            </tr>
                            <tr>
                                <td>06.02.2026</td>
                                <td>{t('Sağım süresi uzadı')}</td>
                                <td>{t('Yüksek')}</td>
                            </tr>
                            <tr>
                                <td>06.02.2026</td>
                                <td>{t('Soğuk zincir sapması')}</td>
                                <td>{t('Kritik')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">{t('Bu sayfa demo amaçlıdır.')}</p>
        </div>
    );
};

export default AiGenelOzet;

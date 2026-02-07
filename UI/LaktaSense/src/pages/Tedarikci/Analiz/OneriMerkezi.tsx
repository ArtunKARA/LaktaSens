import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const OneriMerkezi = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Öneri Merkezi'));
    }, [dispatch]);

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('Öneri Merkezi')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Besleme')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Yem enerji yoğunluğu +%5')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Operasyon')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Sağım saati sabitlenmeli')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Kalite')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Soğuk zincir vardiya kontrolü')}</div>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-4 text-lg font-semibold">{t('Öneri Detayı')}</div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Öneri')}</th>
                                <th>{t('Etki')}</th>
                                <th>{t('Öncelik')}</th>
                                <th>{t('Tarih')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t('Yem karışımı güncelle')}</td>
                                <td>{t('Verim +%4')}</td>
                                <td>{t('Yüksek')}</td>
                                <td>06.02.2026</td>
                            </tr>
                            <tr>
                                <td>{t('Sağım saatini sabitle')}</td>
                                <td>{t('Verim +%2')}</td>
                                <td>{t('Orta')}</td>
                                <td>06.02.2026</td>
                            </tr>
                            <tr>
                                <td>{t('Soğuk zincir kontrol')}</td>
                                <td>{t('Kalite')}</td>
                                <td>{t('Kritik')}</td>
                                <td>06.02.2026</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">{t('Bu sayfa demo amaçlıdır.')}</p>
        </div>
    );
};

export default OneriMerkezi;

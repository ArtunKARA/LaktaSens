import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Tahminler = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Tahminler'));
    }, [dispatch]);

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('Tahminler')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('7 Günlük Süt Verimi Tahmini')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('23.4 L')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('30 Günlük Süt Verimi Tahmini')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('24.1 L')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Haftalık Yem Tüketimi Tahmini')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('3.2 ton')}</div>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-4 text-lg font-semibold">{t('Tahmin Detayı')}</div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>{t('Metrik')}</th>
                                <th>{t('Bugün')}</th>
                                <th>{t('7 Gün')}</th>
                                <th>{t('30 Gün')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t('Süt Verimi')}</td>
                                <td>22.9</td>
                                <td>23.4</td>
                                <td>24.1</td>
                            </tr>
                            <tr>
                                <td>{t('Yem Tüketimi')}</td>
                                <td>0.42</td>
                                <td>3.2</td>
                                <td>13.1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">{t('Bu sayfa demo amaçlıdır.')}</p>
        </div>
    );
};

export default Tahminler;

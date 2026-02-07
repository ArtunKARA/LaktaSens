import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';

const Anomaliler = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Anomali Tespitleri'));
    }, [dispatch]);

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('Anomali Tespitleri')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Verim Düşüşü')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Verim düşüşü (%9)')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('Sağım Süresi')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('Sağım süresi sapması')}</div>
                </div>
                <div className="panel p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('SCC Tahmini')}</div>
                    <div className="mt-2 text-2xl font-semibold">{t('SCC tahmini artış')}</div>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-4 text-lg font-semibold">{t('Anomali Listesi')}</div>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-danger"></span>
                        <span>06.02.2026 — {t('Soğuk zincir 1.5°C yüksek')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-warning"></span>
                        <span>06.02.2026 — {t('Yem tüketimi %12 düştü')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-info"></span>
                        <span>05.02.2026 — {t('Sağım saati 40 dk kaydı')}</span>
                    </li>
                </ul>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">{t('Bu sayfa demo amaçlıdır.')}</p>
        </div>
    );
};

export default Anomaliler;

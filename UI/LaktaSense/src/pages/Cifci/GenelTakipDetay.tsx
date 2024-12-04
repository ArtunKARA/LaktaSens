import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
interface CowData {
  İnekID: string;
  İnekAdı: string;
  Irkı: string;
  Yaşı: number;
  Kilosu: number;
  SütDöngüsüDurumu: string;
  SütKalanGünSayısı: number;
  SütKalanGünDurumu: string;
  YavruDöngüsüDurumu: string;
  YavruKalanGünSayısı: number;
  YavruKalanGünDurumu: string;
  YaşamPayıEnerjiİhtiyacı: number;
}
const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { cowID } = location.state || {}; // State üzerinden gelen ID
  const [cowDetails, setCowDetails] = useState<CowData>();

  useEffect(() => {
      if (!cowID) return; // ID yoksa çağrıyı yapma
      const fetchCowDetails = async () => {
          try {
              const response = await fetch('http://localhost:3030/api/genelTakip/postGenelTakipDetay', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ ID: cowID }),
              });
              const data = await response.json();
              setCowDetails(data);
          } catch (error) {
              console.error('Veri çekerken hata oluştu:', error);
          }
      };

      fetchCowDetails();
  }, [cowID]);


  useEffect(() => {
    dispatch(setPageTitle('Layouts'));
  }, [dispatch]);

  // Örnek veriler, veritabanından çekilecek olan verilerin yerine kullanılabilir

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main container */}
      <div className="w-full flex-grow p-6 bg-white rounded-lg shadow-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">{t('Detail')}</h5>
        </div>

        {/* Form container */}
        <form className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Id')}
            </label>
            <input
              type="text"
              value={cowDetails?.İnekID || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Name')}
            </label>
            <input
              type="text"
              value={cowDetails?.İnekAdı || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Breed')}
            </label>
            <input
              type="text"
              value={cowDetails?.Irkı || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Age')}
            </label>
            <input
              type="text"
              value={cowDetails?.Yaşı || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Weight')}
            </label>
            <input
              type="text"
              value={cowDetails?.Kilosu || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Milk Cycle')}
            </label>
            <input
              type="text"
              value={cowDetails?.SütDöngüsüDurumu || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Life share account')}
            </label>
            <input
              type="text"
              value={cowDetails?.YaşamPayıEnerjiİhtiyacı || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Calvin Cycle')}
            </label>
            <input
              type="text"
              value={cowDetails?.YavruDöngüsüDurumu || ''}
              readOnly
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

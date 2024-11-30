import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle('Layouts'));
  }, [dispatch]);

  // Örnek veriler, veritabanından çekilecek olan verilerin yerine kullanılabilir
  const data = {
    id: '12345',
    name: 'Daisy',
    breed: 'Holstein Friesian',
    age: '4 years',
    weight: '600 kg',
    milkProduction: '30 liters/month',
    lifeShareAccount: 'Active',
    herdStatus: 'Leader',
  };

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
              value={data.id}
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
              value={data.name}
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
              value={data.breed}
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
              value={data.age}
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
              value={data.weight}
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
              value={data.milkProduction}
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
              value={data.lifeShareAccount}
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
              value={data.herdStatus}
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

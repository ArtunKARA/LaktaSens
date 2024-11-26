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

        {/* Data Fields */}
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-700">
              <strong>{t('Id')}:</strong> {data.id}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Name')}:</strong> {data.name}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Breed')}:</strong> {data.breed}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Age')}:</strong> {data.age}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Weight')}:</strong> {data.weight}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Average milk production/month')}:</strong> {data.milkProduction}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Life share account')}:</strong> {data.lifeShareAccount}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>{t('Status in the herd')}:</strong> {data.herdStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layouts;
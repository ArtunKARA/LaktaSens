
//GömülüSensorTakip sayfası kopyası
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için ekledik
import IconPencil from '../../components/Icon/IconPencil';

const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Yönlendirme için kullanılıyor

  useEffect(() => {
    dispatch(setPageTitle('Layouts'));
  }, [dispatch]);

  // Yönlendirme işlemi için bir fonksiyon tanımlıyoruz
  const handleEditTemperatureSensor = () => {
    navigate('/cifci/SicaklikSensorTakip'); // Doğru rota ile yönlendir
  };
  const handleEditCowsTemperatureSensor = () => {
    navigate('/cifci/InekSicaklikSensorTakip'); // Doğru rota ile yönlendir
  };
  const handleEditHumiditySensor = () => {
    navigate('/cifci/NemSensorTakip'); // Doğru rota ile yönlendir
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl -mt-20">
        <h5 className="font-semibold text-lg text-gray-700 mb-6 text-center">
          {t('Sensor Tracking')}
        </h5>

        {/* Form Fields */}
        <form className="space-y-5">
          <div className="grid gap-6">
            {/* Input Field with Edit Button */}
            <div className="relative">
              <label htmlFor="temperatureSensor" className="block font-semibold mb-1">
                {t('Temperature Sensor')}
              </label>
              <div className="flex items-center">
                <input
                  id="temperatureSensor"
                  type="text"
                  className="form-input w-full"
                />
                <button
                  type="button"
                  className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300"
                  title={t('Edit')}
                  onClick={handleEditTemperatureSensor} // Butona tıklanınca yönlendir
                >
                  <IconPencil className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="humiditySensor" className="block font-semibold mb-1">
                {t('Humidity Sensor')}
              </label>
              <div className="flex items-center">
                <input
                  id="humiditySensor"
                  type="text"
                  className="form-input w-full"
                />
                <button
                  type="button"
                  className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300"
                  title={t('Edit')}
                  onClick={handleEditHumiditySensor} // Butona tıklanınca yönlendir
                >
                  <IconPencil className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="cowsBodyTemperature" className="block font-semibold mb-1">
                {t('Cows Body Temperature')}
              </label>
              <div className="flex items-center">
                <input
                  id="cowsBodyTemperature"
                  type="text"
                  className="form-input w-full"
                />
                <button
                  type="button"
                  className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300"
                  title={t('Edit')}
                  onClick={handleEditCowsTemperatureSensor} // Butona tıklanınca yönlendir

                >
                  <IconPencil className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

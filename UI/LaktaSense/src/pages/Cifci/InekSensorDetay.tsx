import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için ekledik
import IconPencil from '../../components/Icon/IconPencil';

const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Yönlendirme için kullanılıyor

  // Başlığı tutacak state
  const [sensorTrackingTitle, setSensorTrackingTitle] = useState('');

  useEffect(() => {
    dispatch(setPageTitle('Layouts'));

    // Veritabanından başlık çekmek için API çağrısı
    const fetchSensorTrackingTitle = async () => {
      try {
        const response = await fetch('/api/sensor-tracking-title'); // Örnek API endpoint
        const data = await response.json();
        setSensorTrackingTitle(data.title); // Gelen başlığı state'e kaydet
      } catch (error) {
        console.error('Başlık alınırken bir hata oluştu:', error);
      }
    };

    fetchSensorTrackingTitle();
  }, [dispatch]);

  // Yönlendirme işlemi için fonksiyonlar
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
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-6xl -mt-20">
        <form className="grid grid-cols-3 gap-6">
          {/* Başlık */}
          <div className="col-span-3 text-center mb-6">
            <label className="font-semibold text-lg text-gray-700">
              {sensorTrackingTitle || t('Loading...')} {/* Başlık geldiğinde göster */}
            </label>
          </div>

          {/* Temperature Sensor */}
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
                onClick={handleEditTemperatureSensor}
              >
                <IconPencil className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Humidity Sensor */}
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
                onClick={handleEditHumiditySensor}
              >
                <IconPencil className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Cows Body Temperature */}
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
                onClick={handleEditCowsTemperatureSensor}
              >
                <IconPencil className="text-gray-500" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

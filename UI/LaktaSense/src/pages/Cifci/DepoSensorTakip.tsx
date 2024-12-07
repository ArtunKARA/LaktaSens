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
    <div>
        {/* Header Section */}
        <div className="panel mt-6">
        
            {/* Form Section */}
        
                <form className="grid grid-cols-3 gap-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                <h5 className="font-semibold text-lg dark:text-white-light">{t('Warehouse Sensor Tracking')}</h5>
            </div>
                    {/* Temperature Sensor */}
                    <div className="relative">
                        <label htmlFor="temperatureSensor" className="block font-semibold mb-1">
                            {t('Temperature Sensor')}
                        </label>
                        <input id="temperatureSensor" type="text" className="form-input w-full" />
                    </div>


                    {/* Cows Body Temperature */}
                    <div className="relative">
                        <label htmlFor="humiditySensor" className="block font-semibold mb-1">
                            {t('Humidity Sensor')}
                        </label>
                        <div className="flex items-center">
                            <input id="humiditySensor" type="text" className="form-input w-full" />
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

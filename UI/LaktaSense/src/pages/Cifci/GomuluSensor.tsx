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
    {/* Input Field with Label */}
    <div>
      <label htmlFor="temperatureSensor" className="block font-semibold mb-1">
        {t('Temperature Sensor')}
      </label>
      <input
        id="temperatureSensor"
        type="text"
        className="form-input w-full"
      />
    </div>

    <div>
      <label htmlFor="humiditySensor" className="block font-semibold mb-1">
        {t('Humidity Sensor')}
      </label>
      <input
        id="humiditySensor"
        type="text"
        className="form-input w-full"
      />
    </div>

    <div>
      <label htmlFor="cowsBodyTemperature" className="block font-semibold mb-1">
        {t('Cows Body Temperature')}
      </label>
      <input
        id="cowsBodyTemperature"
        type="text"
        className="form-input w-full"
      />
    </div>
  </div>

  
</form>

      </div>
    </div>
  );
};

export default Layouts;

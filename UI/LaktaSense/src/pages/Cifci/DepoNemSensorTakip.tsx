import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Layouts = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState("");
  const [sensorType, setSensorType] = useState("temperature"); // Default sensor type
  const { cowID, ad, dollenmeSayisi } = location.state || {};

  const handleSave = async (ID:number) => {
    if (!selectedDate) {
      alert(t("Please select a date!"));
      return;
    }
    if (!sensorType) {
      alert(t("Please select a sensor type!"));
      return;
    }

    try {
      const response = await axios.post("http://localhost:3030/api/servis/postServisEkle", {
        ID: ID,
        Tarih: selectedDate,
        dollenmeSayisi: dollenmeSayisi,
        sensorType: sensorType,
      });

      console.log(response.data);
      alert(t("Saved successfully!"));
      navigate('/cifci/ServisTakip');
    } catch (error) {
      console.error(error);
      alert(t("An error occurred while saving!") + error);
    }
  };

  useEffect(() => {
    dispatch(setPageTitle(t('Add Sensor')));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl -mt-20">
        <h5 className="font-semibold text-lg text-gray-700 mb-6 text-center">
          {t('Add Sensor')}
        </h5>

        {/* Form Fields */}
        <form className="space-y-5">
          <div className="grid gap-6">
            {/* Sensor QR */}
            <div>
              <label htmlFor="sensorQR" className="block text-gray-700">
                {t('Sensor QR')}
              </label>
              <input
                type="text"
                placeholder={t('Sensor QR')}
                className="form-input w-full"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)} // Update state
          
              />
            </div>

            {/* Sensor Name */}
            <div>
              <label htmlFor="sensorName" className="block text-gray-700">
                {t('Sensor Name')}
              </label>
              <input
                type="text"
                placeholder={t('Sensor Name')}
                className="form-input w-full"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)} // Update state
              />
            </div>

            {/* Sensor Type Dropdown */}
            <div>
              <label htmlFor="sensorType" className="block text-gray-700">
                {t('Sensor Type')}
              </label>
              <select
                id="sensorType"
                className="form-input w-full"
                value={sensorType} // Bind to state
                onChange={(e) => setSensorType(e.target.value)} // Update state
              >
                <option value="temperature">{t('Barn Sensor')}</option>
                <option value="humidity">{t('Warehouse Sensor')}</option>
                <option value="pressure">{t('Leash Sensor')}</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            style={{ backgroundColor: '#9ed895', color: 'white' }} // Butonu yeşil yapmka için kullandım
            className="btn btn-primary w-full"
            onClick={() => handleSave(Number(cowID))}
          >
            {t('Save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

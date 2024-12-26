import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Layouts = () => {
  const storedUserInfo = localStorage.getItem('userInfo');
  const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const [SensorQR, setSensorQR] = useState("");
  const [sensorName, setsensorName] = useState("");
  const [sensorType, setSensorType] = useState(1); // Default sensor type

  const handleSave = async () => {
    if (!SensorQR) {
      alert("Please write Sensor QR");
      return;
    }
    if (!sensorType) {
      alert("Please select a Sensor Type!");
      return;
    }
    if (!sensorName) {
      alert("Please write a Sensor Name!");
      return;
    }
  
    try {
      const response = await axios.post(
        "/apie/sensor/kayit",
        {
          SensorQR: SensorQR,
          Tipi: sensorType,
          FirmaID: userInfo.kullaniciID,
          SensorAdi: sensorName,
        },
        {
          headers: {
            "Content-Type": "application/json", // JSON formatını belirtin
          },
        }
      );
  
      console.log(response.data);
      alert("Saved successfully!");
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving: " + error);
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
                value={SensorQR}
                onChange={(e) => setSensorQR(e.target.value)} // Update state
          
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
                value={sensorName}
                onChange={(e) => setsensorName(e.target.value)} // Update state
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
                onChange={(e) => setSensorType(Number(e.target.value))} // Update state
              >
                {/* <option value="1" >{t('Barn Sensor')}</option>
                <option value="2">{t('Warehouse Sensor')}</option>*/}
                <option value="3">{t('Leash Sensor')}</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            style={{ backgroundColor: '#9ed895', color: 'white' }} // Butonu yeşil yapmka için kullandım
            className="btn btn-primary w-full"
            onClick={() => handleSave()}
          >
            {t('Save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

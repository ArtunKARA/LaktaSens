import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
const Layouts = () => {
  const navigate = useNavigate()
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setselectedStatus] = useState("");
  const { cowID, ad, dollenmeSayisi } = location.state || {};

  const handleSave = async (ID:number) => {
    if (!selectedDate) {
      alert(t("Please select a date!"));
      return;
    }    
    if (!selectedStatus) {
      alert(t("Please select a status!"));
      return;
    }

    try {
      const response = await axios.post("http://localhost:3030/api/servis/postServisEkle", {
        ID: ID, 
        Tarih: selectedDate,
        dollenmeSayisi: dollenmeSayisi, 
        tuttuMu: selectedStatus,
      });

      console.log(response.data);
      alert(t("Saved successfully!"));
      navigate('/cifci/ServisTakip');
    } catch (error) {
      console.error(error);
      alert(t("An error occurred while saving!")+ error);
    }
  };

  useEffect(() => {
    dispatch(setPageTitle(t('Fertilization Tracking')));
  }, [dispatch]);

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setselectedStatus(event.target.value);  // Seçilen durumu güncelle
  };
  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl -mt-20">
        <h5 className="font-semibold text-lg text-gray-700 mb-6 text-center">
          {t('Fertilization Tracking')}
        </h5>

        {/* Form Fields */}
        <form className="space-y-5">
          <div className="grid gap-6">
            {/* Input Fields */}
            <div>
              <input
                type="text"
                placeholder={t('Name')}
                className="form-input w-full"
                value={ad || ''}
                readOnly
              />
            </div>
            <div>
              <input
                type="date"
                placeholder={t('Last Fertilization Date')}
                className="form-input w-full"
                id="tarih" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={t('Escaped Fertilization')}
                value={dollenmeSayisi || ''}
                readOnly
                className="form-input w-full"
              />
            </div>
          </div>

          {/* Döllenme Tuttu Mu? Radio Buttons */}
          <div className="mb-4">
            <span className="block font-semibold mb-2">{t('Did the fertilization take?')}</span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fertilization"
                  value="E"
                  className="mr-2"
                  checked={selectedStatus === "E"}
                  onChange={handleStatusChange}
                />
                {t('Yes')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fertilization"
                  value="H"
                  className="mr-2"
                  checked={selectedStatus === "H"}
                  onChange={handleStatusChange}
                />
                {t('No')}
              </label>
            </div>
          </div>

     

          {/* Submit Button */}
          <button type="button" className="btn btn-primary w-full"
            onClick={() => handleSave(Number(cowID))}
          >
            {t('Submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

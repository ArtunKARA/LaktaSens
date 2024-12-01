import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isOlderThanTwoYears, setIsOlderThanTwoYears] = useState(false); // Yaş kontrolü state'i
  const [milkCycle, setMilkCycle] = useState('');
  const [calvingCycle, setCalvingCycle] = useState('');
  const [name, setName] = useState('Daisy');
  const [breed, setBreed] = useState('Holstein Friesian');
  const [birthDate, setBirthDate] = useState('2019-04-15');
  const [weight, setWeight] = useState('600 kg');

  useEffect(() => {
    dispatch(setPageTitle('Layouts'));

    // İnek yaşı kontrolü
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(birthDate).getFullYear();
    const age = currentYear - birthYear;

    setIsOlderThanTwoYears(age >= 2);
  }, [dispatch, birthDate]);

  const handleSave = () => {
    // Kaydetme işlemleri burada yapılabilir
    console.log('Form kaydedildi:', {
      name,
      breed,
      birthDate,
      weight,
      milkCycle,
      calvingCycle,
    });
    alert(t('Form has been saved!')); // Kullanıcıya mesaj göstermek için
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main container */}
      <div className="w-full flex-grow p-6 bg-white rounded-lg shadow-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">{t('Add Cow')}</h5>
        </div>

        {/* Form container */}
        <form className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Temel bilgiler */}
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)} // Input'u güncellemek için
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Breed')}
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)} // Input'u güncellemek için
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Birth Date')}
            </label>
            <input
              type="date" // Doğum tarihi için tarih seçici ekledik
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)} // Input'u güncellemek için
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">
              {t('Weight')}
            </label>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)} // Input'u güncellemek için
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>

          {/* 2 yaşından büyükse ek bilgiler */}
          {isOlderThanTwoYears && (
            <>
              <div>
                <label className="text-gray-700 font-semibold">
                  {t('Milk Cycle')}
                </label>
                <select
                  value={milkCycle}
                  onChange={(e) => setMilkCycle(e.target.value)} // Seçim alanını güncellemek için
                  className="mt-2 p-2 w-full bg-white border border-gray-300 rounded-md"
                >
                  <option value="" disabled>
                    {t('Select Milk Cycle')}
                  </option>
                  <option value="sağımda">{t('Sağımda')}</option>
                  <option value="kuruda">{t('İn Dry')}</option>
                </select>
              </div>
              <div>
                <label className="text-gray-700 font-semibold">
                  {t('Calving Cycle')}
                </label>
                <select
                  value={calvingCycle}
                  onChange={(e) => setCalvingCycle(e.target.value)} // Seçim alanını güncellemek için
                  className="mt-2 p-2 w-full bg-white border border-gray-300 rounded-md"
                >
                  <option value="" disabled>
                    {t('Select Calving Cycle')}
                  </option>
                  <option value="gebe">{t('Pregnant')}</option>
                  <option value="serviste">{t('In Service')}</option>
                </select>
              </div>
            </>
          )}
        </form>

         {/* Kaydet Butonu */}
         <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 w-full bg-[#016b00] text-white rounded-md shadow hover:bg-[#014d00] focus:ring-2 focus:ring-[#016b00]"
          >
            {t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layouts;

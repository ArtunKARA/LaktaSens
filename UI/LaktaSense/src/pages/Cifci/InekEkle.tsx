import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

const Layouts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isOlderThanTwoYears, setIsOlderThanTwoYears] = useState(false);
  const [milkCycle, setMilkCycle] = useState('');
  const [calvingCycle, setCalvingCycle] = useState('');
  const [name, setName] = useState('Daisy');
  const [breed, setBreed] = useState('Holstein Friesian');
  const [birthDate, setBirthDate] = useState('2019-04-15');
  const [weight, setWeight] = useState('600');
  const [knowsLastCalvingDate, setKnowsLastCalvingDate] = useState('no');// Başlangıçta 'Hayır' seçili
  const [lastCalvingDate, setLastCalvingDate] = useState('');

  useEffect(() => {
    dispatch(setPageTitle('Layouts'));

    const currentYear = new Date().getFullYear();
    const birthYear = new Date(birthDate).getFullYear();
    const age = currentYear - birthYear;

    setIsOlderThanTwoYears(age >= 2);
  }, [dispatch, birthDate]);

  const handleSave = () => {
    console.log('Form kaydedildi:', {
      name,
      breed,
      birthDate,
      weight,
      milkCycle,
      calvingCycle,
      knowsLastCalvingDate,
      lastCalvingDate,
    });
    alert(t('Form has been saved!'));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="w-full flex-grow p-6 bg-white rounded-lg shadow-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">{t('Add Cow')}</h5>
        </div>

        <form className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-700 font-semibold">{t('Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">{t('Breed')}</label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">{t('Birth Date')}</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold">{t('Weight')}</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || Number(value) >= 0) {
                  setWeight(value); // Sayısal değeri güncelle
                }
              }}
              className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>

          {isOlderThanTwoYears && (
            <>
            <div>
  <label className="text-gray-700 font-semibold">{t('Do you know the last calving date?')}</label>
  <div className="mt-2 flex justify-center gap-6">
    
    <label className="flex items-center">
      <input
        type="radio"
        name="calvingDate"
        value="inService"
        onChange={() => setKnowsLastCalvingDate('inService')} // İlk durum
        checked={knowsLastCalvingDate === 'inService'}
        className="mr-2"
      />
      {t('İn service and due date is known')}
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        name="calvingDate"
        value="pregnant"
        onChange={() => setKnowsLastCalvingDate('pregnant')} // İkinci durum
        checked={knowsLastCalvingDate === 'pregnant'}
        className="mr-2"
      />
      {t('Pregnancy and date of last fertilization are known')}
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        name="calvingDate"
        value="no"
        onChange={() => setKnowsLastCalvingDate('no')} // Üçüncü durum
        checked={knowsLastCalvingDate === 'no'}
        className="mr-2"
      />
      {t('No')}
    </label>
  </div>
</div>

{/* Koşullara Göre Alanlar */}
{knowsLastCalvingDate === 'inService' && (
  <div>
    <label className="text-gray-700 font-semibold">{t('Last Calving Date')}</label>
    <input
      type="date"
      value={lastCalvingDate}
      onChange={(e) => setLastCalvingDate(e.target.value)}
      className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
    />
  </div>
)}
{knowsLastCalvingDate === 'pregnant' && (
  <div>
    <label className="text-gray-700 font-semibold">{t('last fertilization date')}</label>
    <input
      type="date"
      value={lastCalvingDate}
      onChange={(e) => setLastCalvingDate(e.target.value)}
      className="mt-2 p-2 w-full bg-gray-100 border border-gray-300 rounded-md"
    />
  </div>
)}

{knowsLastCalvingDate === 'no' && (
  <div className="mt-4 flex gap-6">
    <div className="w-full sm:w-1/2">
      <label className="text-gray-700 font-semibold">{t('Milk Cycle')}</label>
      <select
        value={milkCycle}
        onChange={(e) => setMilkCycle(e.target.value)}
        className="mt-2 p-2 w-full bg-white border border-gray-300 rounded-md"
      >
        <option value="" disabled>{t('Select Milk Cycle')}</option>
        <option value="sağımda">{t('Sağımda')}</option>
        <option value="kuruda">{t('Dry')}</option>
      </select>
    </div>
    <div className="w-full sm:w-1/2">
      <label className="text-gray-700 font-semibold">{t('Calving Cycle')}</label>
      <select
        value={calvingCycle}
        onChange={(e) => setCalvingCycle(e.target.value)}
        className="mt-2 p-2 w-full bg-white border border-gray-300 rounded-md"
      >
        <option value="" disabled>{t('Select Calving Cycle')}</option>
        <option value="gebe">{t('Pregnant')}</option>
        <option value="serviste">{t('In Service')}</option>
      </select>
    </div>
  </div>
)}
            </>
          )}
        </form>

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

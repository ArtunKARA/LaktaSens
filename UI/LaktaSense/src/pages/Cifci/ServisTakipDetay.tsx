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
          {t('Detail')}
        </h5>

        {/* Form Fields */}
        <form className="space-y-5">
          <div className="grid gap-6">
            {/* Input Fields */}
            <div>
              <input
                type="text"
                placeholder={t('Id')}
                className="form-input w-full"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={t('Name')}
                className="form-input w-full"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={t('Breed')}
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
                  value="yes"
                  className="mr-2"
                />
                {t('Yes')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fertilization"
                  value="no"
                  className="mr-2"
                />
                {t('No')}
              </label>
            </div>
          </div>

          {/* Required Fields Text */}
          <div className="!mt-2 text-center">
            <span className="text-gray-500 text-[11px] inline-block">
              * {t('Required Fields')}
            </span>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-full">
            {t('Submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Layouts;

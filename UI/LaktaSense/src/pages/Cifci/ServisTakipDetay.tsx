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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Main Container */}
      <div className="grid grid-cols-12 gap-4 w-full max-w-screen-xl">
        {/* Empty Columns for Centering */}
        <div className="col-span-3"></div>

        {/* Form Column */}
        <div className="col-span-6 bg-white rounded-lg shadow-lg p-6">
          <h5 className="font-semibold text-lg text-gray-700 mb-5 text-center">
            {t('Detail')}
          </h5>

          {/* Form Fields */}
          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <input
                  type="text"
                  placeholder={t('Age')}
                  className="form-input w-full"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t('Weight')}
                  className="form-input w-full"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t('Status in the herd')}
                  className="form-input w-full"
                />
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

        {/* Empty Columns for Centering */}
        <div className="col-span-3"></div>
      </div>
    </div>
  );
};

export default Layouts;

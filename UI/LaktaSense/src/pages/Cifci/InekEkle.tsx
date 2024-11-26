
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CodeHighlight from '../../components/Highlight';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconCode from '../../components/Icon/IconCode';

const Layouts = () => {
    const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Layouts'));
  }, [dispatch]);
  
  const [codeArr, setCodeArr] = useState<string[]>(['code1', 'code2', 'code3', 'code4', 'code5', 'code6', 'code7', 'code8']);
  
  const toggleCode = (name: string) => {
    if (codeArr.includes(name)) {
      setCodeArr((value) => value.filter((d) => d !== name));
    } else {
      setCodeArr([...codeArr, name]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main container */}
      <div className="w-full flex-grow p-6 bg-white rounded-lg shadow-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h5 className="font-semibold text-lg dark:text-white-light">{t('Detail')}</h5>
          <button 
            type="button" 
            className="font-semibold hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600"
            onClick={() => toggleCode('code4')}
          >
          </button>
        </div>

        {/* Form Fields */}
        <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-3">
            <form className="space-y-5">
              {/* Form Inputs (6 fields, 3 per row) */}
              <div className="grid grid-cols-1 sm:grid-cols-2  gap-5">
                <div>
                  <input type="Id" placeholder={t('Id')} className="form-input" />
                </div>
                <div>
                  <input type="Name" placeholder={t('Name')} className="form-input" />
                </div>
                <div>
                  <input type="Breed" placeholder={t('Breed')} className="form-input" />
                </div>
                <div>
                  <input type="Age" placeholder={t('Age')} className="form-input" />
                </div>
                <div>
                  <input type="Weigth" placeholder={t('Weigth')} className="form-input" />
                </div> 
                <div>
                  <input type="Average milk production/month" placeholder={t('Average milk production/month')} className="form-input" />
                </div>
                <div>
                  <input type="Life share account" placeholder={t('Life share account')} className="form-input" />
                </div>
                <div>
                  <input type="Status in the herd" placeholder={t('Status in the herd')} className="form-input" />
                </div>
              </div>

              {/* Required Fields Text */}
              <div className="!mt-2">
                <span className="text-white-dark text-[11px] inline-block">*Required Fields</span>
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary !mt-6 w-full">
              {t('Submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    
  );
};

export default Layouts;




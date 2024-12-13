import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';

const Layouts = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { cowID, ad, dollenmeSayisi } = location.state || {};

  const validationSchema = Yup.object({
    date: Yup.string().required(t('Please select a date!')),
    status: Yup.string().required(t('Please select a status!')),
  });

  const handleSave = async (ID: number, values: any) => {
    try {
      const response = await axios.post('http://localhost:3030/api/servis/postServisEkle', {
        ID: ID,
        Tarih: values.date,
        dollenmeSayisi: dollenmeSayisi,
        tuttuMu: values.status,
      });

      console.log(response.data);
      alert(t('Saved successfully!'));
      navigate('/cifci/ServisTakip');
    } catch (error) {
      console.error(error);
      alert(t('An error occurred while saving!') + error);
    }
  };

  useEffect(() => {
    dispatch(setPageTitle(t('Fertilization Tracking')));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl -mt-20">
        <h5 className="font-semibold text-lg text-gray-700 mb-6 text-center">
          {t('Fertilization Tracking')}
        </h5>

        {/* Form Fields */}
        <Formik
  initialValues={{
    date: selectedDate,
    status: selectedStatus,
  }}
  validationSchema={validationSchema}
  onSubmit={(values) => {
    if (Object.keys(values).length === 2 && values.date && values.status) {
      handleSave(Number(cowID), values);
    }
  }}
>
  {({ errors, touched, setFieldValue, values }) => (
    <Form className="space-y-5">
      <div className="grid gap-6">
        {/* Input Fields */}
        <div>
          <Field
            type="text"
            placeholder={t('Name')}
            className="form-input w-full"
            value={ad || ''}
            readOnly
          />
        </div>
        <div>
          <Field
            type="date"
            placeholder={t('Last Fertilization Date')}
            className="form-input w-full"
            id="tarih"
            name="date"
            value={values.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('date', e.target.value)} 
          />
          {errors.date && touched.date && <div className="text-danger">{errors.date}</div>}
        </div>
        <div>
          <Field
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
            <Field
              type="radio"
              name="status"
              value="E"
              className="mr-2"
              checked={values.status === 'E'}
              onChange={() => setFieldValue('status', 'E')}
            />
            {t('Yes')}
          </label>
          <label className="flex items-center">
            <Field
              type="radio"
              name="status"
              value="H"
              className="mr-2"
              checked={values.status === 'H'}
              onChange={() => setFieldValue('status', 'H')}
            />
            {t('No')}
          </label>
        </div>
        {errors.status && touched.status && <div className="text-danger">{errors.status}</div>}
      </div>

      {/* Submit Button */}
      <button type="submit" className="btn btn-primary w-full">
        {t('Submit')}
      </button>
    </Form>
  )}
</Formik>

      </div>
    </div>
  );
};

export default Layouts;  
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../../components/Icon/IconX';
import axios from 'axios';
import {useNavigate } from 'react-router-dom';
import { isEmpty, set, toNumber } from 'lodash';
import IconPlus from '../../../../components/Icon/IconPlus';
import Swal from 'sweetalert2';
import Select, { SingleValue, StylesConfig } from 'react-select';
import IconEdit from '../../../../components/Icon/IconEdit';
import IconTrash from '../../../../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { useLocation } from 'react-router-dom';
import IconSave from '../../../../components/Icon/IconSave';
import IconRestore from '../../../../components/Icon/IconRestore';
import { be } from '@fullcalendar/core/internal-common';


interface DefData {
  besinDegeriID: string;
  tipID: string;
  besinTipi: string;
  miktar: string;
  birimID: string;
  birimAdi: string;
}
interface MetaData {
  yemID: string;
  yemAdi: string;
  durum: string;
  yemAciklama: string;
  birimFiyat?: string;
  minSiparisKg?: string;
  maxSiparisKg?: string;
}
interface SelectedData {
  besinDegeriID: string;
  tipID: string;
  birimAdi: string;
  miktar: string;
}
interface OptionType {
    value: string;
    label: string;
    unit: string;
}
const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<DefData[]>([]);
    const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
    const [unitOpitons, setUnitOptions] = useState<OptionType[]>([]);
    const [typeOpitons, setTypeOptions] = useState<OptionType[]>([]);
    const [metaData, setMetaData] = useState<MetaData | null>(null);
    const [modalEdit, setModalAddEdit] = useState(false);


    const location = useLocation();
    const initID = (location.state as { yemID?: string })?.yemID ?? null;
    const [yemID, setYemID] = useState<string | null>(initID);

    //-----------Veriyi burdan çekiliyor-----------
    useEffect(() => {
      const fetchData = async () => {

        if (!yemID) {
          setMetaData(null);
          setRowData([]);
          return;
        }
      
        try {
          const response = await fetch(
            'http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariDetay',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ yemID }),
            }
          );
          const data = await response.json();
    
          // Üst bilgileri ayır
          const { yemID: id, yemAdi, durum, yemAciklama, birimFiyat, minSiparisKg, maxSiparisKg, besinDegerleri } = data;
    
          // State’lere ata
          setMetaData({
            yemID: String(id),      // API’den number gelebilir, biz string istiyoruz
            yemAdi,
            durum,
            yemAciklama,
            birimFiyat: birimFiyat != null ? String(birimFiyat) : '',
            minSiparisKg: minSiparisKg != null ? String(minSiparisKg) : '',
            maxSiparisKg: maxSiparisKg != null ? String(maxSiparisKg) : '',
          });
          setRowData(besinDegerleri);
    
        } catch (err) {
          console.error('API çağrısı sırasında hata:', err);
        }
    
        // Tip fetch ile alıyoruz
        try {
          const { data: birimler } = await axios.get(
            'http://localhost:3030/api/tanimlamalar/birimler/getBesinTipleri'
          );
          const unitOptions = birimler.map((o: any) => ({
            value: o.tipID,
            label: o.tipAdi,
            unit: `${o.birimAdi} – ${o.aciklama}`,
          }));
          setUnitOptions(unitOptions);
        } catch (err) {
          console.error('Birim seçenekleri alınırken hata:', err);
        }
      };
    
      fetchData();
    }, [yemID]);
      const menuStyles: StylesConfig<OptionType, false> = {
        // this ensures the portal’ed menu sits above everything else
        menuPortal: base => ({ ...base, zIndex: 9999 }),
      };
      const UnitSelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
            form.setFieldValue('birimAdi', selectedOption ? selectedOption.unit : '');
        };
    
        return (
            <Select
                options={options}
                value={options ? options.find(option => option.value === field.value) : null}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={menuStyles}
                onChange={handleChange}
                placeholder={t('Please Select')}
                isSearchable={true}
                isClearable={true}
            />
        );
    };
    

      
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('Standard Feed Details')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<DefData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'birimID');
        setInitialRecords(sortedData);
    }, [rowData]);
    
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modalDelete, setModalDelete] = useState(false);
    const [modalAdd, setModalAdd] = useState(false);
    const [delID,setDelID] = useState('');
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'birimID',
        direction: 'asc',
    });
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item) => {
                return (
                    item.besinDegeriID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.besinTipi.toLowerCase().includes(search.toLowerCase()) ||
                    item.miktar.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.birimID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.birimAdi.toLowerCase().includes(search.toLowerCase()) ||
                    item.tipID.toString().toLowerCase().includes(search.toLowerCase()) 
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);

    const navigate = useNavigate();
    //-----------İçerik verisi burdan ekleniyor-----------
    const Add = async (data:SelectedData) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariBesinDegerleriEkle", {
            yemID: yemID,
            tipID: data.tipID,
            miktar: data.miktar,
          });
    
          console.log(response.data);
          toast.fire({
            icon: 'success',
            title: 'Veri Başarı İle Eklendi Dev',
            padding: '10px 20px',
        });
          setModalAdd(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
        }
      };
      //-----------İçerik verisi burdan Düzenleniyor-----------
    const Edit = async (data:SelectedData) => {
      const toast = Swal.mixin({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          timer: 3000,
      });
      try {
        const response = await axios.post("http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariBesinDegerleriGuncelle", {
          besinDegeriID: data.besinDegeriID,
          tipID: data.tipID,
          miktar: data.miktar,
        });
  
        console.log(response.data);
        toast.fire({
          icon: 'success',
          title: 'Veri Başarı İle Eklendi Dev',
          padding: '10px 20px',
      });
        setModalAdd(false); // Modalı kapat.
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert(t("An error occurred while saving!")+ error);
      }
    };
    //-----------İçerik verisi burdan silme-----------
    const Delete = async (ID:string) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariBesinDegerleriSil", {
            besinDegeriID: ID
          });
    
          console.log(response.data);
          toast.fire({
            icon: 'success',
            title: 'Veri Başarı İle Silindi',
            padding: '10px 20px',
        });
          setModalDelete(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
          alert(ID);
        }
      };

    //-----------Metadata verisi burdan silme-----------
    const MetaDelete = async (ID:string) => {
      const toast = Swal.mixin({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          timer: 3000,
      });
      try {
        const response = await axios.post("http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariSil", {
          yemID: ID
        });
  
        console.log(response.data);
        toast.fire({
          icon: 'success',
          title: 'Veri Başarı İle Silindi',
          padding: '10px 20px',
      });
        setModalDelete(false); // Modalı kapat.
        navigate('/admin/parameter/standartYemler');
      } catch (error) {
        console.error(error);
        alert(t("An error occurred while saving!")+ error);
        alert(ID);
      }
    };
    //-----------Metadata verisi burdan güncele-----------
    const MetaUpdate = async (
      ID: string,
      yemAdi: String,
      yemAciklama: String,
      durum: String,
      birimFiyat?: string,
      minSiparisKg?: string,
      maxSiparisKg?: string
    ) => {
      const toast = Swal.mixin({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          timer: 3000,
      });
      try {
        const normalizeNumber = (value?: string) => (value === undefined || value === null || value === '' ? null : Number(value));
        const response = await axios.post("http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariGuncele", {
          yemID: ID,
          yemAdi: yemAdi,
          yemAciklama: yemAciklama,
          durum: durum,
          birimFiyat: normalizeNumber(birimFiyat),
          minSiparisKg: normalizeNumber(minSiparisKg),
          maxSiparisKg: normalizeNumber(maxSiparisKg)
        });
  
        console.log(response.data);
        toast.fire({
          icon: 'success',
          title: 'Veri Başarı İle Silindi',
          padding: '10px 20px',
      });
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert(t("An error occurred while saving!")+ error);
        alert(ID);
      }
    };
    //-----------Metadata verisi burdan ekele-----------
    const MetaAdd = async (
      yemAdi: string,
      yemAciklama: string,
      durum: string,
      birimFiyat?: string,
      minSiparisKg?: string,
      maxSiparisKg?: string
    ) => {
      const toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000
      });
  
      try {
        const normalizeNumber = (value?: string) => (value === undefined || value === null || value === '' ? null : Number(value));
        const { data } = await axios.post(
          'http://localhost:3030/api/tanimlamalar/yemTanimlari/postYemTanimlariOlustur',
          {
            yemAdi,
            yemAciklama,
            durum,
            birimFiyat: normalizeNumber(birimFiyat),
            minSiparisKg: normalizeNumber(minSiparisKg),
            maxSiparisKg: normalizeNumber(maxSiparisKg)
          }
        );
  
        /** ⬇⬇⬇ API’den gelen yeni ID burada  ------------------- */
        const newID: string | undefined = data?.yemID;
        if (newID) {
          setYemID(newID);                       // 1) bileşen state’i güncelle
          /* 2) aynı veya başka bir route’a geçerken
                yeni ID’yi route‑state olarak ilet */
          navigate('.', { replace: true, state: { yemID: newID } });
        }
  
        toast.fire({
          icon: 'success',
          title: 'Kayıt başarıyla eklendi',
          padding: '10px 20px'
        });
  
        setModalDelete(false);
        // window.location.reload();  // ihtiyaç kalmadıysa kaldırabilirsiniz
      } catch (err) {
        console.error(err);
        alert('An error occurred while saving!\n' + err);
      }
    };

    const submitDataFormValidation = Yup.object().shape({
        tipID:  Yup.string(),
        miktar: Yup.string().required(t('Please Fill In')),
      });
    
    const [feedDeleteModal, setFeedDeleteModal] = useState(false);

    return (
        <div>
            <div className="panel">
            <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
              <h5 className="font-semibold text-lg dark:text-white-light">{t('Feed Details')}</h5>
            </div>
            <div className="p-5">
              <Formik
              initialValues={{
                yemID: metaData?.yemID || null,
                yemAdi: metaData?.yemAdi || '',
                durum: metaData?.durum || '',
                yemAciklama: metaData?.yemAciklama || '',
                birimFiyat: metaData?.birimFiyat || '',
                minSiparisKg: metaData?.minSiparisKg || '',
                maxSiparisKg: metaData?.maxSiparisKg || '',
              }}
              enableReinitialize
              validationSchema={Yup.object().shape({
                yemAdi: Yup.string().required(t('Please Fill In')),
                durum: Yup.string().required(t('Please Fill In')),
                yemAciklama: Yup.string(),
              })}
              onSubmit={(values) => {
                console.log('Form values:', values);
                if (isEmpty(metaData?.yemID)) {
                  MetaAdd(values.yemAdi, values.yemAciklama, values.durum, values.birimFiyat, values.minSiparisKg, values.maxSiparisKg);
                }
                else {
                  MetaUpdate(metaData!.yemID, values.yemAdi, values.yemAciklama, values.durum, values.birimFiyat, values.minSiparisKg, values.maxSiparisKg);
                }
                setModalAdd(false);
              }}
              >
              {({ errors, touched, submitCount }) => (
                <Form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <label className="form-label">{t('Feed Name')}</label>
                  <Field
                    name="yemAdi"
                    className={`form-input ${errors.yemAdi && touched.yemAdi ? 'border-danger' : ''}`}
                  />
                   {submitCount ? (
                        errors.yemAdi ? (
                            <div className="text-danger mt-1">{errors.yemAdi}</div>
                        ) : (
                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                        )
                    ) : (
                        ''
                    )}
                  </div>
                  <div>
                  <label className="form-label">{t('Status')}</label>
                  <Field
                    as="select"
                    name="durum"
                    className={`form-input ${errors.durum && touched.durum ? 'border-danger' : ''}`}
                  >
                    <option value="">{t('Please Select')}</option>
                    <option value="a">{t('Active')}</option>
                    <option value="p">{t('Passive')}</option>
                    <option value="b">{t('Pending')}</option>
                  </Field>
                  {submitCount ? (
                        errors.durum ? (
                            <div className="text-danger mt-1">{errors.durum}</div>
                        ) : (
                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                        )
                    ) : (
                        ''
                    )}
                  </div>
                  <div>
                    <label className="form-label">{t('Unit Price')}</label>
                    <Field name="birimFiyat" type="number" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">{t('Min Order (kg)')}</label>
                    <Field name="minSiparisKg" type="number" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">{t('Max Order (kg)')}</label>
                    <Field name="maxSiparisKg" type="number" className="form-input" />
                  </div>
                  <div className="md:col-span-2">
                  <label className="form-label">{t('Description')}</label>
                  <Field
                    as="textarea"
                    name="yemAciklama"
                    className={`form-input ${errors.yemAciklama && touched.yemAciklama ? 'border-danger' : ''}`}
                  />
                   {submitCount ? (
                        errors.yemAciklama ? (
                            <div className="text-danger mt-1">{errors.yemAciklama}</div>
                        ) : (
                            <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                        )
                    ) : (
                        ''
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="submit" className="btn btn-primary gap-2">
                  <IconSave />
                  {t('Save')}
                  </button>
                  <button type="reset" className="btn btn-secondary gap-2">
                    <IconRestore />
                  {t('Reset')}
                  </button>
                  {metaData?.yemID && <button type="button" className="btn btn-danger gap-2" onClick={() =>{ isEmpty(metaData?.yemID) ? setFeedDeleteModal(false): setFeedDeleteModal(true) }}>
                    <IconTrash />
                  {t('Delete')}
                  </button>}
                  <Transition appear show={feedDeleteModal} as={Fragment}>
                    <Dialog as="div" open={feedDeleteModal} onClose={() => setFeedDeleteModal(false)}>
                      <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                        <div className="flex min-h-screen items-center justify-center px-4">
                          <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                            <div className="flex items-center justify-between p-5">
                              <h5>{t('Delete')}</h5>
                              <button
                                type="button"
                                onClick={() => setFeedDeleteModal(false)}
                                className="text-white-dark hover:text-dark"
                              >
                                <IconX className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="p-5">
                              <form className="space-y-2">
                                <div className="relative mb-4">
                                  <p>{t('Are you sure you want to delete feed all data?')}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => MetaDelete(metaData!.yemID)} // Silme fonksiyonu çağrısı
                                  className="btn btn-danger w-full"
                                >
                                  {t("Delete")}
                                </button>
                                <button
                                      type="button"
                                      onClick={() => setModalDelete(false)}
                                      className="btn btn-warning w-full"
                                    >
                                    {t("Cancel")}
                                </button>
                              </form>
                            </div>
                          </Dialog.Panel>
                        </div>
                      </div>
                    </Dialog>
                  </Transition>
                </div>
                </Form>
              )}
              </Formik>
            </div>
            </div>
            <Transition appear show={modalEdit} as={Fragment}>
              <Dialog as="div" open={modalEdit} onClose={() => {setModalAddEdit(false); setSelectedData(null);}}>
                  <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                      <div className="flex min-h-screen items-center justify-center px-4">
                      <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                          <div className="flex items-center justify-between p-5">
                          <h5>{!selectedData ? t('Add'): t('Edit')}</h5>
                          <button
                              type="button"
                              onClick={() => {setModalAddEdit(false); setSelectedData(null);}}
                              className="text-white-dark hover:text-dark"
                          >
                              <IconX className="w-5 h-5" />
                          </button>
                          </div>
                          <div className="p-5">
                          <div>
                              <Formik
                                  enableReinitialize={true} 
                                  initialValues={{
                                      besinDegeriID: selectedData?.besinDegeriID || '',
                                      tipID: selectedData?.tipID || '',
                                      birimAdi: selectedData?.birimAdi || '',
                                      miktar: selectedData?.miktar || '',
                                  }}
                                  validationSchema={submitDataFormValidation}
                                  onSubmit={() => {}}
                              >{({ errors, submitCount, touched, values }) => (
                                  <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                      <div className="flex flex-col sm:flex-row">
                                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5">
                                          <div>
                                                  <label htmlFor="tipID">{t('Nutrition Type')}</label>
                                                  <Field 
                                                          name="tipID"
                                                          component={UnitSelect}
                                                          options={unitOpitons}
                                                  />
                                                  {submitCount ? (
                                                      errors.tipID ? (
                                                          <div className="text-danger mt-1">{errors.tipID}</div>
                                                      ) : (
                                                          <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                      )
                                                  ) : (
                                                      ''
                                                  )}
                                              </div>
                                              <div>
                                                  <label htmlFor="miktar">{t('Quantity')}</label>
                                                  <Field name="miktar" id="miktar" type="number" className="form-input" />
                                                  {submitCount ? (
                                                      errors.miktar ? (
                                                          <div className="text-danger mt-1">{errors.miktar?.toString()}</div>
                                                      ) : (
                                                          <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                      )
                                                  ) : (
                                                      ''
                                                  )}
                                              </div>
                                              <div>
                                                  <label htmlFor="birimAdi">{t('Unit')}</label>
                                                  <Field name="birimAdi" id="birimAdi" type="text" className="form-input" readOnly/>
                                                  {submitCount ? (
                                                      errors.birimAdi ? (
                                                          <div className="text-danger mt-1">{errors.birimAdi?.toString()}</div>
                                                      ) : (
                                                          <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                      )
                                                  ) : (
                                                      ''
                                                  )}
                                              </div>
                                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                              <button
                                                      type="submit"
                                                      className="btn btn-primary !mt-6"
                                                      onClick={() => {
                                                          console.log(Object.keys(errors));
                                                          if ( !selectedData && Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                              Add(values);
                                                          }else if (Object.keys(touched).length !== 0 && Object.keys(errors).length === 0) {
                                                              Edit(values);
                                                          }
                                                      }}
                                                  >
                                                      {t('Save')}
                                                  </button>
                                                  <button
                                                      type="button"
                                                      className="btn btn-danger !mt-6"
                                                      onClick={() => {
                                                          setModalAddEdit(false);
                                                          setSelectedData(null);
                                                      }}
                                                  >
                                                      {t('Cancel')}
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </Form>)}
                              </Formik>
                          </div>
                          </div>
                      </Dialog.Panel>
                      </div>
                  </div>
                  </Dialog>
              </Transition>
            <div className="panel mt-6">
                <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Standard Feed Content')}</h5>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-success gap-2" onClick={() => setModalAddEdit(true)}>
                            <IconPlus />
                            {t('Add')}
                        </button>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            {
                                accessor: 'besinDegeriID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'besinTipi',
                                title: t('Nutrition Type'),
                                sortable: true
                            },
                            {
                              accessor: 'miktar',
                              title: t('Cuantity'),
                              sortable: true
                            },
                            {
                              accessor: 'birimAdi',
                              title: t('Unit'),
                              sortable: true
                            },
                            {
                                accessor: 'Edit',
                                title: t('Edit'),
                                render: ({besinDegeriID,tipID,birimAdi,miktar}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Edit">
                                            <button type="button"
                                            onClick={() => {                                              
                                              setSelectedData({
                                                besinDegeriID: besinDegeriID,
                                                tipID: tipID,
                                                birimAdi: birimAdi,
                                                miktar: miktar,
                                              });
                                              setModalAddEdit(true);
                                              }}>
                                                <IconEdit />
                                            </button>
                                        </Tippy>
                                </div>
                                ),
                            },
                            {
                                accessor: 'Delete',
                                title: t('Delete'),
                                render: ({besinDegeriID}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Delete">
                                            <button type="button"
                                            onClick={() => {                                              
                                            setModalDelete(true)
                                            setDelID(besinDegeriID);
                                            }}>
                                                <IconTrash />
                                            </button>
                                        </Tippy>
                                      <Transition appear show={modalDelete} as={Fragment}>
                                      <Dialog as="div" open={modalDelete} onClose={() => setModalDelete(false)}>
                                        <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                          <div className="flex min-h-screen items-center justify-center px-4">
                                            <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                                              <div className="flex items-center justify-between p-5">
                                                <h5>{t('Delete')}</h5>
                                                <button
                                                  type="button"
                                                  onClick={() => setModalDelete(false)}
                                                  className="text-white-dark hover:text-dark"
                                                >
                                                  <IconX className="w-5 h-5" />
                                                </button>
                                              </div>
                                              <div className="p-5">
                                                <form className="space-y-2">
                                                  <div className="relative mb-4">
                                                    <p>{t('Are you sure you want to delete this data?')}</p>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => Delete(delID)} // Kaydetme fonksiyonu çağrısı
                                                    className="btn btn-danger w-full"
                                                  >
                                                    {t("Delete")}
                                                  </button>
                                                  <button
                                                        type="button"
                                                        onClick={() => setModalDelete(false)}
                                                        className="btn btn-warning w-full"
                                                      >
                                                      {t("Cancel")}
                                                  </button>
                                                </form>
                                              </div>
                                            </Dialog.Panel>
                                          </div>
                                        </div>
                                      </Dialog>
                                    </Transition>
                                </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MultipleTables;


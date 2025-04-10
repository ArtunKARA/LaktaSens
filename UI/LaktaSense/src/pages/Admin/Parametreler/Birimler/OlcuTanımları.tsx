import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../../../components/Icon/IconBell';
import IconXCircle from '../../../../components/Icon/IconXCircle';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../../components/Icon/IconX';
import axios from 'axios';
import {useNavigate } from 'react-router-dom';
import { isEmpty, toNumber } from 'lodash';
import IconPlus from '../../../../components/Icon/IconPlus';
import Swal from 'sweetalert2';
import IconMenu from '../../../../components/Icon/IconMenu';
import IconEdit from '../../../../components/Icon/IconEdit';
import IconTrash from '../../../../components/Icon/IconTrash';
import { string } from 'yup';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';


interface DefData {
    birimID: string;
    birimAdi: string;
    aciklama: string;
}


const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<DefData[]>([]);
    const [selectedData, setSelectedData] = useState<DefData | null>(null);
    //-----------Veriyi burdan çekiliyor-----------
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/tanimlamalar/birimler/getOlcu', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            console.log('Gelen veri:', data);
            setRowData(data); // Sadece doğrudan kullanılabilecek bir dizi olduğunda kullanı
          } catch (error) {
            console.error('API çağrısı sırasında bir hata oluştu:', error);
          }
        };
    
        fetchData();
      }, []); // Boş bağımlılık dizisi, component mount olduğunda sadece bir kez çalıştırılır


    const { t } = useTranslation();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle(t('Measure')));
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
    const [modalEdit, setModalEdit] = useState(false);
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
                    item.birimID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.birimAdi.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.aciklama.toLowerCase().includes(search.toLowerCase())
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
    //-----------Veriyi burdan ekleniyor-----------
    const Add = async (data:DefData) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/tanimlamalar/birimler/postOlcuEkle", {
            birimAdi: data.birimAdi,
            aciklama: data.aciklama 
          });
    
          console.log(response.data);
          toast.fire({
            icon: 'success',
            title: 'Veri Başarı İle Eklendi',
            padding: '10px 20px',
        });
          setModalAdd(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
        }
      };
    //-----------Veriyi burdan düzenleme-----------
    const Edit = async (data:DefData) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/tanimlamalar/birimler/postOlcuGuncele", {
            birimID: data.birimID,
            birimAdi: data.birimAdi,
            aciklama: data.aciklama
          });
    
          console.log(response.data);
          toast.fire({
            icon: 'success',
            title: 'Veri Başarı İle Güncelendi',
            padding: '10px 20px',
        });
          setModalEdit(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
        }
      };
    //-----------Veriyi burdan silme-----------
    const Delete = async (ID:string) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/tanimlamalar/birimler/postOlcuSil", {
            birimID: ID, 
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
        }
      };

    const submitDataFormValidation = Yup.object().shape({
        birimID:  Yup.string(),
        birimAdi: Yup.string().required(t('Please Fill In')),
        aciklama: Yup.string().required(t('Please Fill In')),
    });

    return (
        <div>
        <Transition appear show={modalEdit} as={Fragment}>
            <Dialog as="div" open={modalEdit} onClose={() => {setModalEdit(false); setSelectedData(null);}}>
                <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                    <div className="flex min-h-screen items-center justify-center px-4">
                    <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                        <div className="flex items-center justify-between p-5">
                        <h5>{!selectedData ? t('Add'): t('Edit')}</h5>
                        <button
                            type="button"
                            onClick={() => {setModalEdit(false); setSelectedData(null);}}
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
                                    birimID: selectedData?.birimID || '',
                                    birimAdi: selectedData?.birimAdi || '',
                                    aciklama: selectedData?.aciklama || '',
                                }}
                                validationSchema={submitDataFormValidation}
                                onSubmit={() => {}}
                            >{({ errors, submitCount, touched, values }) => (
                                <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5">
                                            <div>
                                                <label htmlFor="birimAdi">{t('Measure Name')}</label>
                                                <Field name="birimAdi" id="birimAdi" type="text" className="form-input" />
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
                                            <div>
                                                <label htmlFor="aciklama">{t('Description')}</label>
                                                <Field name="aciklama" id="aciklama" type="text" className="form-input" />
                                                {submitCount ? (
                                                    errors.aciklama ? (
                                                        <div className="text-danger mt-1">{errors.aciklama?.toString()}</div>
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
                                                        setModalEdit(false);
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
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Measure')}</h5>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-success gap-2" onClick={() => setModalEdit(true)}>
                            <IconPlus />
                            {t('Add New')}
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
                                accessor: 'birimID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'birimAdi',
                                title: t('Measure Name'),
                                sortable: true
                            },
                            {
                                accessor: 'aciklama',
                                title: t('Description'),
                                sortable: true
                            },
                            {
                                accessor: 'Edit',
                                title: t('Edit'),
                                render: ({birimID,birimAdi,aciklama}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Edit">
                                            <button type="button"
                                            onClick={() => {                                              
                                              setModalEdit(true)
                                              setSelectedData({
                                                birimID: birimID,
                                                birimAdi: birimAdi,
                                                aciklama: aciklama
                                              });}}>
                                                <IconEdit />
                                            </button>
                                        </Tippy>
                                </div>
                                ),
                            },
                            {
                                accessor: 'Delete',
                                title: t('Delete'),
                                render: ({birimID}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Delete">
                                            <button type="button"
                                            onClick={() => {                                              
                                            setModalDelete(true)
                                            setDelID(birimID);
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
                                                <h5>{t('Edit')}</h5>
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

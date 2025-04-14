import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../components/Icon/IconBell';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toNumber } from 'lodash';
import IconPlus from '../../components/Icon/IconPlus';
import Swal from 'sweetalert2';

interface CompanyData {
    CompanyID: string;
    CompanyName: string;
    CompanyPhone: string;
    CompanyMail: string;
    CompanyCity: string;
    CompanyDistrict: string;
    CompanyRejectedBefore: number;
    CompanyRejectedReason: string;
}

interface CompanyRejectStatusData {
  CompanyID: string;
  CompanyName: string;
  CompanyRejectedBefore: number;
  CompanyRejectedReason: string;
}

const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<CompanyData[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyRejectStatusData | null>(null);
    const [reson, setReson] = useState("");
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/basvurular/getCifciBasvurular', {
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
        dispatch(setPageTitle(t('Application Farms')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<CompanyData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'inekID');
        setInitialRecords(sortedData);
    }, [rowData]);
    
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modal21, setModal21] = useState(false);
    const [modalAcceptCheck, setModalAcceptCheck] = useState(false);
    const [modal22, setModal22] = useState(false);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'inekID',
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
                    item.CompanyID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyName.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyPhone.toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyMail.toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyCity.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyDistrict.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyRejectedReason.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.CompanyRejectedBefore.toString().toLowerCase().includes(search.toLowerCase()) 
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

    const acceptCompany = async (ID:number) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
          const response = await axios.post("http://localhost:3030/api/basvurular/postBasvuruKabul", {
            firmaID: ID, 
          });
    
          console.log(response.data);
          toast.fire({
            icon: 'success',
            title: 'Başvuru Başarı İle Alıdı',
            padding: '10px 20px',
        });
          setModal21(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
        }
      };
    const navigate = useNavigate();
    const handleDetailClickService = (CompanyID : any, ad:string, dollenmeSayisi:number) => {
        navigate('/cifci/ServisTakipDetay', { state: { cowID: CompanyID, ad: ad,dollenmeSayisi: dollenmeSayisi } });
    };
    const handleEditInekEkle = (id : any) => {
        navigate('/cifci/InekEkle', { state: { cowID: id } });
    };
    
    const Accept = (CompanyID : string, CompanyRejectedBefore : number) => {
        if(CompanyRejectedBefore > 0){
          setModalAcceptCheck(true);
        }else{
          setModal21(true);
        }
    };

    const rejectCompany = async (CompanyID : number,reson: string) =>{
        const toast = Swal.mixin({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          timer: 3000,
      });
      if (reson.length == 0) {
        toast.fire({
          icon: 'warning',
          title: t("Please fill a reject reson!"),
          padding: '10px 20px',
        });
        return;
      }
  
      try {
        const response = await axios.post("http://localhost:3030/api/basvurular/postBasvuruRed", {
          firmaID: CompanyID, 
          redSebebi: reson
        });
  
        console.log(response.data);
        toast.fire({
          icon: 'success',
          title: t("Saved successfully!"),
          padding: '10px 20px',
      });
        setModal22(false); // Modalı kapat.
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert(t("An error occurred while saving!")+ error);
      }
    }

    const handleCikarilanlar = () => {
      navigate('/cifci/Cikarilanlar');
    };
    const statusColor = (durum : number) => {
      const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
      if(durum == 0){
          return color[2]
      }else if(durum > 0  || durum < 4){
          return color[4]
      }else{
        return color[3]
      }
    };

    const Details = (CompanyID : string) => {
      navigate('/admin/CiflikDetay', { state: { CompanyID: CompanyID } });
    }; 
    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Application Farms')}</h5>
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
                                accessor: 'CompanyID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'CompanyName',
                                title: t('Farm Name'),
                                sortable: true
                            },
                            {
                                accessor: 'CompanyPhone',
                                title: t('Telephone'),
                                sortable: true,
                            },
                            { 
                                accessor: 'CompanyMail',
                                title: t('Email'), 
                                sortable: true
                            },
                            {
                                accessor: 'CompanyCity',
                                title: t('City'),
                                sortable: true,
                            },
                            {
                                accessor: 'CompanyDistrict',
                                title: t('District'),
                                sortable: true,
                            },
                            {
                              accessor: 'CompanyRejectedBefore',
                              title: t('Num. of Reject'),
                              sortable: true,
                              render: ({ CompanyRejectedBefore }) => <span className={`badge bg-${statusColor(CompanyRejectedBefore)}`}>{CompanyRejectedBefore}</span>, 
                            },
                            {
                                accessor: 'Accept',
                                title: t('Accept'),
                                render: ({CompanyID, CompanyRejectedBefore, CompanyRejectedReason,CompanyName}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 bg-green-100 rounded-full">
                                        <Tippy content="Accept">
                                            <button type="button"
                                            onClick={() => {
                                              Accept(CompanyID,CompanyRejectedBefore)
                                                setSelectedCompany({
                                                    CompanyID: CompanyID,
                                                    CompanyName: CompanyName,
                                                    CompanyRejectedBefore: CompanyRejectedBefore,
                                                    CompanyRejectedReason: CompanyRejectedReason
                                                });
                                              }}>
                                                <IconPlus />
                                            </button>
                                        </Tippy>

                                        <Transition appear show={modalAcceptCheck} as={Fragment}>
                                          <Dialog as="div" open={modalAcceptCheck} onClose={() => setModalAcceptCheck(false)}>
                                            <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                              <div className="flex min-h-screen items-center justify-center px-4">
                                                <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                                                  <div className="flex items-center justify-between p-5">
                                                    <h5><strong>{selectedCompany?.CompanyName}</strong> {t('company\'s application')} </h5>
                                                    <button
                                                      type="button"
                                                      onClick={() => setModalAcceptCheck(false)}
                                                      className="text-white-dark hover:text-dark"
                                                    >
                                                      <IconX className="w-5 h-5" />
                                                    </button>
                                                  </div>
                                                  <div className="p-5">
                                                    <form className="space-y-2">
                                                        <div className="relative mb-4">
                                                          <p className="p-2">{t('Number of applications of the company:')}</p>
                                                          <p className="p-2 text-red-400">{selectedCompany?.CompanyRejectedBefore}</p>
                                                          <p className="p-2">{t('This company was previously rejected, most recently for the following reason:')}</p>
                                                          <p className="p-2 text-red-400">{selectedCompany?.CompanyRejectedReason}</p>
                                                        </div>
                                                      <button
                                                        type="button"
                                                        onClick={() => acceptCompany(Number(CompanyID))}
                                                        className="btn btn-success w-full gap-5"
                                                      >
                                                        {t("Accept")}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => Details(selectedCompany!.CompanyID)}
                                                        className="btn btn-warning w-full"
                                                      >
                                                        {t("Go To Farm Data")}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => setModalAcceptCheck(false)}
                                                        className="btn btn-danger w-full"
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
                                      <Transition appear show={modal21} as={Fragment}>
                                      <Dialog as="div" open={modal21} onClose={() => setModal21(false)}>
                                        <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                          <div className="flex min-h-screen items-center justify-center px-4">
                                            <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                                            <div className="flex items-center justify-between p-5">
                                                    <h5><strong>{selectedCompany?.CompanyName}</strong> {t('company\'s application')} </h5>
                                                    <button
                                                      type="button"
                                                      onClick={() => setModal21(false)}
                                                      className="text-white-dark hover:text-dark"
                                                    >
                                                      <IconX className="w-5 h-5" />
                                                    </button>
                                                  </div>
                                                  <div className="p-5">
                                                    <form className="space-y-2">
                                                      <button
                                                        type="button"
                                                        onClick={() => acceptCompany(Number(CompanyID))}
                                                        className="btn btn-success w-full gap-5"
                                                      >
                                                        {t("Accept")}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => setModal21(false)}
                                                        className="btn btn-danger w-full"
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
                            {
                                accessor: 'Reject',
                                title: t('Reject'),
                                render: ({CompanyID,CompanyName,CompanyRejectedBefore,CompanyRejectedReason}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 bg-red-100 rounded-full">
                                        <Tippy content="Reject">
                                            <button type="button"
                                            onClick={() => {                                              
                                              setModal22(true)
                                              setSelectedCompany({
                                                  CompanyID: CompanyID,
                                                  CompanyName: CompanyName,
                                                  CompanyRejectedBefore: CompanyRejectedBefore,
                                                  CompanyRejectedReason: CompanyRejectedReason
                                              });}}>
                                                <IconXCircle />
                                            </button>
                                        </Tippy>
                                      <Transition appear show={modal22} as={Fragment}>
                                      <Dialog as="div" open={modal22} onClose={() => setModal22(false)}>
                                        <div className="fixed inset-0 z-10 overflow-y-auto bg-[black]/10">
                                          <div className="flex min-h-screen items-center justify-center px-4">
                                            <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                                              <div className="flex items-center justify-between p-5">
                                                <h5><strong>{selectedCompany?.CompanyName}</strong> {t('company\'s application')} </h5>
                                                <button
                                                  type="button"
                                                  onClick={() => setModal22(false)}
                                                  className="text-white-dark hover:text-dark"
                                                >
                                                  <IconX className="w-5 h-5" />
                                                </button>
                                              </div>
                                              <div className="p-5">
                                                <form className="space-y-2">
                                                  <div className="relative mb-4">
                                                    <label htmlFor="redSebebi">{t('Reject Reson')}</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Neden?" 
                                                        className="form-input border border-gray-300 rounded-lg p-2 text-gray-700" 
                                                        id="redSebebi" 
                                                        value={reson} 
                                                        onChange={(e) => setReson(e.target.value)} 
                                                    />
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => rejectCompany(toNumber(CompanyID),reson)} // Kaydetme fonksiyonu çağrısı
                                                    className="btn btn-warning w-full"
                                                  >
                                                    {t("Reject")}
                                                  </button>
                                                  <button
                                                        type="button"
                                                        onClick={() => setModal22(false)}
                                                        className="btn btn-danger w-full"
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

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
import Add from '../Apps/Invoice/Add';
import { toNumber } from 'lodash';

interface CowData {
    İnekID: string;
    Ad: string;
    Irkı: string;
    Sebep: string;
    AksiyonAlınacakDöngü: string;
    KalanGün: number;
    DöllenmeSayısı: number;
}

const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<CowData[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [reson, setReson] = useState("");
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/cikarilacaklar/postCikarilanlar', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ firmaID:userInfo.firmaID}), // Kullanıcı ID'sini gönderiyorsunuz
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
        dispatch(setPageTitle(t('Will Be Removed')));
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<CowData[]>([]);
    useEffect(() => {
        const sortedData = sortBy(rowData, 'inekID');
        setInitialRecords(sortedData);
    }, [rowData]);
    
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [modal21, setModal21] = useState(false);
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
                    item.İnekID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.KalanGün.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.Ad.toLowerCase().includes(search.toLowerCase()) ||
                    item.Sebep.toLowerCase().includes(search.toLowerCase()) ||
                    item.Irkı.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.AksiyonAlınacakDöngü.toString().toLowerCase().includes(search.toLowerCase())
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

    const handleSave = async (ID:number) => {
        if (!selectedDate) {
          alert(t("Please select a date!"));
          return;
        }
    
        try {
          const response = await axios.post("http://localhost:3030/api/sagim/postSagimAksiyon", {
            ID: ID, 
            Tarih: selectedDate,
          });
    
          console.log(response.data);
          alert(t("Saved successfully!"));
          setModal21(false); // Modalı kapat.
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert(t("An error occurred while saving!")+ error);
        }
      };
    const navigate = useNavigate();
    const handleDetailClickService = (İnekID : any, ad:string, dollenmeSayisi:number) => {
        navigate('/cifci/ServisTakipDetay', { state: { cowID: İnekID, ad: ad,dollenmeSayisi: dollenmeSayisi } });
    };
    const handleEditInekEkle = (id : any) => {
        navigate('/cifci/InekEkle', { state: { cowID: id } });
    };
    
    const inCycle = (İnekID : string, BulunduğuDöngü : string, DöllenmeSayısı: number,Ad: string) => {
        if(BulunduğuDöngü == "Sagim"){
          setModal21(true);
        }else if(BulunduğuDöngü == "Gebe"){
          handleEditInekEkle(İnekID);
        }else if(BulunduğuDöngü == "Servis"){
          handleDetailClickService(İnekID,Ad,DöllenmeSayısı);
        }
    };

    const handleOutCycle = async (İnekID : number) =>{
      if (!selectedDate) {
        alert(t("Please select a date!"));
        return;
      }
  
      try {
        const response = await axios.post("http://localhost:3030/api/cikarilacaklar/postCikarilanInek", {
          İnekID: İnekID, 
          CikarilmaTarihi: selectedDate,
          CikarilmaSebebi: reson
        });
  
        console.log(response.data);
        alert(t("Saved successfully!"));
        setModal22(false); // Modalı kapat.
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert(t("An error occurred while saving!")+ error);
      }
    }

    const handleCikarilanlar = () => {
      navigate('/cifci/CikarilacaklarTakip');
    }; 
    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Removed Cows')}</h5>
                    <button type="button" className="btn btn-warning ltr:ml-auto rtl:mr-auto" onClick={() => handleCikarilanlar()}>{t('Will Be Removed')}</button>
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
                                accessor: 'İnekID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'Ad',
                                title: t('Name'),
                                sortable: true
                            },
                            {
                                accessor: 'Irkı',
                                title: t('Breed'),
                                sortable: true,
                            },
                            {
                              accessor: 'CikarilmaTarihi',
                              title: t('Date of Removal from the Loop'),
                              sortable: true,
                            },
                            {
                                accessor: 'CikarilmaSebebi',
                                title: t('Reason for Decommissioning'),
                                sortable: true,
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

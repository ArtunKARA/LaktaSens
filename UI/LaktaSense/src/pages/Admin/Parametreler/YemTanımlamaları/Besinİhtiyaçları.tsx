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
import { isEmpty, toNumber } from 'lodash';
import IconPlus from '../../../../components/Icon/IconPlus';
import Swal from 'sweetalert2';
import Select, { SingleValue, StylesConfig } from 'react-select';
import IconEdit from '../../../../components/Icon/IconEdit';
import IconTrash from '../../../../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';


interface DefData {
    standartID: string;
    laktasyonDonemi: string;
}
interface SelectedData {
    standartID: string;
}
interface OptionType {
    value: string;
    label: string;
}
const MultipleTables = () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [rowData, setRowData] = useState<DefData[]>([]);
    const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
    const [unitOpitons, setUnitOptions] = useState<OptionType[]>([]);

    //-----------Veriyi burdan çekiliyor-----------
    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:3030/api/tanimlamalar/yemTanimlari/getRasyonDonguler', {
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
      const menuStyles: StylesConfig<OptionType, false> = {
        // this ensures the portal’ed menu sits above everything else
        menuPortal: base => ({ ...base, zIndex: 9999 }),
      };
      const UnitSelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
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
        dispatch(setPageTitle(t('Lactation Period Nutrient Needs')));
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
                    item.standartID.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.laktasyonDonemi.toString().toLowerCase().includes(search.toLowerCase())
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
          const response = await axios.post("", {
            yemAdi: data.laktasyonDonemi
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

    const submitDataFormValidation = Yup.object().shape({
        tipID:  Yup.string(),
        tipAdi: Yup.string().required(t('Please Fill In')),
        birimID: Yup.string().required(t('Please Fill In')),
    });
    
    //-----------Detaylar Yada Ekele-----------
    const handleStandartYemlerDetay = (id?: string | number) => {
        if (id !== undefined) {
          navigate('/admin/parameter/gerekliBesinDeğerleriDetay', { state: { standartID: id } });
        } else {
          navigate('/admin/parameter/gerekliBesinDeğerleriDetay');
        }
      };

    
    const statusColor = (durum : String) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        if(durum == "Aktif"){
            return color[2]
        }else if(durum == "Pasif"){
            return color[3]
        }else if(durum == "Beklemede"){
            return color[4]
        }
    };
    

    return (
        <div>
            <div className="panel mt-6">
                <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{t('Lactation Period Nutrient Needs')}</h5>
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
                                accessor: 'standartID',
                                title: t('ID'),
                                sortable: true
                            },
                            {
                                accessor: 'laktasyonDonemi',
                                title: t('Lactation Period'),
                                sortable: true
                            },
                            {
                                accessor: 'Edit',
                                title: t('Edit'),
                                render: ({standartID}) => (
                                    <div className="flex items-center w-max mx-auto gap-2 rounded-full">
                                        <Tippy content="Edit">
                                            <button type="button"
                                            onClick={() => {                                              
                                              setSelectedData({
                                                standartID: standartID
                                              });
                                              handleStandartYemlerDetay(standartID);
                                              }}>
                                                <IconEdit />
                                            </button>
                                        </Tippy>
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


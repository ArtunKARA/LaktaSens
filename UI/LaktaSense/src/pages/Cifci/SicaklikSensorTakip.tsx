
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import IconPencil from '../../components/Icon/IconPencil';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconBell from '../../components/Icon/IconBell';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconTrashLines from '../../components/Icon/IconTrashLines';


const rowData = [
    {
        id: 1,
        firstName: 'Caroline',
        lastName: 'Jensen',
        sensorData: 'Temperature: 22°C',
        status: 'active',
      },
      {
        id: 2,
        firstName: 'Celeste',
        lastName: 'Grant',
        sensorData: 'Humidity: 45%',
        status: 'inactive',
      },
      {
        id: 3,
        firstName: 'Tillman',
        lastName: 'Forbes',
        sensorData: 'Temperature: 18°C',
        status: 'inactive',
      },
      {
        id: 4,
        firstName: 'Daisy',
        lastName: 'Whitley',
        sensorData: 'Pressure: 1020 hPa',
        status: 'active',
      },
      {
        id: 5,
        firstName: 'Weber',
        lastName: 'Bowman',
        sensorData: 'Humidity: 60%',
        status: 'inactive',
      },
      {
        id: 6,
        firstName: 'Buckley',
        lastName: 'Townsend',
        sensorData: 'Temperature: 25°C',
        status: 'active',
      },
      {
        id: 7,
        firstName: 'Latoya',
        lastName: 'Bradshaw',
        sensorData: 'Pressure: 1015 hPa',
        status: 'active',
      },
      {
        id: 8,
        firstName: 'Kate',
        lastName: 'Lindsay',
        sensorData: 'Temperature: 20°C',
        status: 'active',
      },
      {
        id: 9,
        firstName: 'Marva',
        lastName: 'Sandoval',
        sensorData: 'Humidity: 50%',
        status: 'inactive',
      },
      {
        id: 10,
        firstName: 'Decker',
        lastName: 'Russell',
        sensorData: 'Pressure: 1018 hPa',
        status: 'inactive',
      },
];

const MultipleTables = () => {
  const { t } = useTranslation();
  const [page2, setPage2] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize2, setPageSize2] = useState(PAGE_SIZES[0]);
  const [initialRecords2, setInitialRecords2] = useState(sortBy(rowData, 'firstName'));
  const [recordsData2, setRecordsData2] = useState(initialRecords2);
  const [search2, setSearch2] = useState('');
  const [sortStatus2, setSortStatus2] = useState<DataTableSortStatus>({
    columnAccessor: 'firstName',
    direction: 'asc',
  });

  const [modal21, setModal21] = useState(false);

  useEffect(() => {
    const from = (page2 - 1) * pageSize2;
    const to = from + pageSize2;
    setRecordsData2([...initialRecords2.slice(from, to)]);
  }, [page2, pageSize2, initialRecords2]);

  useEffect(() => {
    setInitialRecords2(() => {
      return rowData.filter((item: any) => {
        return (
          item.firstName.toLowerCase().includes(search2.toLowerCase()) ||
          item.lastName.toLowerCase().includes(search2.toLowerCase()) ||
          item.sensorData.toLowerCase().includes(search2.toLowerCase()) ||
          item.status.toLowerCase().includes(search2.toLowerCase())
        );
      });
    });
  }, [search2]);

  useEffect(() => {
    const data2 = sortBy(initialRecords2, sortStatus2.columnAccessor);
    setInitialRecords2(sortStatus2.direction === 'desc' ? data2.reverse() : data2);
  }, [sortStatus2]);

  const randomColor = () => {
    const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    const random = Math.floor(Math.random() * color.length);
    return color[random];
  };

  const randomStatus = () => {
    const status = ['PAID', 'APPROVED', 'FAILED', 'CANCEL', 'SUCCESS', 'PENDING', 'COMPLETE'];
    const random = Math.floor(Math.random() * status.length);
    return status[random];
  };

  return (
    <div>
      <div className="panel mt-6">
        <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
          <h5 className="font-semibold text-lg dark:text-white-light">{t('Temperature Sensor Tracking')}</h5>
          <div className="ltr:ml-auto rtl:mr-auto">
            <input
              type="text"
              className="form-input w-auto"
              placeholder="Search..."
              value={search2}
              onChange={(e) => setSearch2(e.target.value)}
            />
          </div>
        </div>
        <div className="datatables">
          <DataTable
            className="whitespace-nowrap table-hover"
            records={recordsData2}
            columns={[
              {
                accessor: 'Sensor',
                title: t('Sensor'),
                sortable: true,
                render: ({ firstName, lastName, id }) => (
                  <div className="flex items-center w-max">
                    <img
                      className="w-9 h-9 rounded-full ltr:mr-2 rtl:ml-2 object-cover"
                      src={`/assets/images/profile-${id}.jpeg`}
                      alt=""
                    />
                    <div>{firstName + ' ' + lastName}</div>
                  </div>
                ),
              },
              {
                accessor: 'Sensor Data',
                title: t('Sensor Data'),
                sortable: true,
              },
              {
                accessor: 'status',
                title: t('Status'),
                sortable: true,
                render: () => <span className={`badge bg-${randomColor()} `}>{randomStatus()}</span>,
              },
              {
                accessor: 'Actions',
                title: t('Actions'),
                render: () => (
                  <div className="flex items-center gap-2">
                    <Tippy content="Edit">
                      <button type="button"onClick={() => setModal21(true)} className="btn btn-primary">
                        <IconPencil />
                      </button>
                    </Tippy>
                   
                    <Transition appear show={modal21} as={Fragment}>
                      <Dialog as="div" open={modal21} onClose={() => setModal21(false)}>
                        <div className="fixed inset-0 z-10 overflow-y-auto ">
                          <div className="flex min-h-screen items-center justify-center px-4">
                            <Dialog.Panel className="panel my-8 w-full max-w-sm overflow-hidden rounded-lg py-1 px-4 text-black dark:text-white-dark">
                              <div className="flex items-center justify-between p-5">
                                <h5> {t('Pass to other loop')}</h5>
                                <button
                                  type="button"
                                  onClick={() => setModal21(false)}
                                  className="text-white-dark hover:text-dark"
                                >
                                  <IconX className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="p-5">
                                <form>
                                  <div className="relative mb-4">
                                    <input type="date" placeholder="Tarih" className="form-input" id="tarih" />
                                  </div>
                                  <button type="button" className="btn btn-primary w-full">
                                  {t('Save')}
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
            totalRecords={initialRecords2.length}
            recordsPerPage={pageSize2}
            page={page2}
            onPageChange={(p) => setPage2(p)}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={setPageSize2}
            sortStatus={sortStatus2}
            onSortStatusChange={setSortStatus2}
            minHeight={200}
          />
        </div>
      </div>
    </div>
  );
};

export default MultipleTables;

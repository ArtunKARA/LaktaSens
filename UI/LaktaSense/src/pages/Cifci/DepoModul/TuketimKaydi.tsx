import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';
import Select, { SingleValue, StylesConfig } from 'react-select';
import { Field, Form, Formik } from 'formik';
import ReactApexChart from 'react-apexcharts';
import Dropdown from '../../../components/Dropdown';
import IconHorizontalDots from '../../../components/Icon/IconHorizontalDots';
import IconSettings from '../../../components/Icon/IconSettings';
import { IRootState } from '../../../store';
import Swal from 'sweetalert2';

interface OptionType {
    value: string;
    label: string;
}

interface DefData {
    yemID: string;
    tuketimMiktari: string;
    aciklama: string;
}

interface AnaData {
    yemAdi: string;
    zamanGrubu: string;
    tuketimKg: string;
    depoStok: string;
}

const TuketimKayit = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const location = useLocation();
    const { cowID } = location.state || {}; // State üzerinden gelen ID
    const [isOlderThanTwoYears, setIsOlderThanTwoYears] = useState(false);
    const [knowsLastCalvingDate, setKnowsLastCalvingDate] = useState('no'); // Başlangıçta 'Hayır' seçili
    const [lastCalvingDate, setLastCalvingDate] = useState('');
    const storedUserInfo = localStorage.getItem('userInfo');
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const [zamanTipiDagilim, setzamanTipiDagilim] = useState('aylik');
    const [zamanTipi, setzamanTipi] = useState<'aylik' | 'yillik' | 'haftalik'>('aylik');
    const [unitOpitons, setUnitOptions] = useState<OptionType[]>([]);
    const [consumData, setConsumData] = useState<AnaData[]>([]);
    const [selectedData, setSelectedData] = useState<DefData | null>(null);
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const [selectedFeed, setSelectedFeed] = useState<string | null>('');

    const bilinmeyenSave = async () => {
        try {
            const response = await axios.post('http://localhost:3030/api/inekEkle/postBilinmeyenTarih', {
                ad: name,
                irk: 'breed',
                kilo: 'weight',
                dogumTarih: 'birthDate',
                sutDongusu: 'milkCycle',
                yavrulamaDongusu: 'calvingCycle',
                firmaID: userInfo.firmaID,
            });

            console.log(response.data);
            alert(t('Saved successfully!'));
            navigate('/cifci/dashboard');
        } catch (error) {
            console.error(error);
            alert(t('An error occurred while saving!') + error);
        }
    };

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postStokListesi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                const formattedData = data.map((item: { yemID: string; yemAdi: string }) => ({
                    value: item.yemID,
                    label: item.yemAdi,
                }));
                setUnitOptions(formattedData);
                console.log('Gelen veri:', data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // API'yi çağırma
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3030/api/depo/postCiflikYemTuketimAnaliz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firmaID: userInfo.firmaID, yemID: selectedFeed, zamanTipi: zamanTipi }), // Kullanıcı ID'sini gönderiyorsunuz
                });
                const data = await response.json();
                console.log('Gelen veri:', data);
                setConsumData(data);
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
            }
        };

        fetchData();
    }, [selectedFeed, zamanTipi]);

    const menuStyles: StylesConfig<OptionType, false> = {
        // this ensures the portal’ed menu sits above everything else
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };
    const UnitSelect = ({ field, form, options }: { field: any; form: any; options: OptionType[] }) => {
        const handleChange = (selectedOption: SingleValue<OptionType> | null) => {
            form.setFieldValue(field.name, selectedOption ? selectedOption.value : '');
            setSelectedFeed(selectedOption ? selectedOption.value : '');
        };

        return (
            <Select
                options={options}
                value={options ? options.find((option) => option.value === field.value) : null}
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

    const submitFormValidation = Yup.object().shape({
        yemID: Yup.string().required(t('Please select a feed!')),
        tuketimMiktari: Yup.number().required(t('Please enter a feed amount!')).positive(t('Please enter a positive number!')).min(0.01, t('Please enter a positive number!')),
        aciklama: Yup.string().max(255, t('Description cannot exceed 255 characters!')),
    });
    const [loading] = useState(false);

    const today = new Date();
    const [futureCount, setFutureCount] = useState(0);
    function parseZamanGrubu(str: string, tip: 'yillik' | 'aylik' | 'haftalik'): Date | null {
        if (!str) return null;

        if (tip === 'yillik') {
            const y = Number(str);
            return isNaN(y) ? null : new Date(y, 0, 1); // 1 Ocak
        }

        if (tip === 'aylik') {
            // "2025-04"
            const [y, m] = str.split('-').map(Number);
            return isNaN(y) || isNaN(m) ? null : new Date(y, m - 1, 1);
        }

        if (tip === 'haftalik') {
            // "2025-17"
            const [y, w] = str.split('-').map(Number);
            if (isNaN(y) || isNaN(w)) return null;
            // ISO‑8601: 4 Ocak içeren hafta 1’dir
            const jan4 = new Date(y, 0, 4);
            const jan4Day = jan4.getDay() || 7; // Pazar=7
            const offset = (w - 1) * 7 + (1 - jan4Day);
            const monday = new Date(jan4);
            monday.setDate(jan4.getDate() + offset);
            return monday; // haftanın ilk günü
        }

        return null;
    }

    useEffect(() => {
        const dataArr = Array.isArray(consumData) ? consumData : [];
        const today = new Date();

        const count = dataArr.reduce((acc, d) => {
            const dt = parseZamanGrubu(d.zamanGrubu, zamanTipi); // 👈 doğru parser
            return dt && dt > today ? acc + 1 : acc;
        }, 0);

        setFutureCount(count);
        console.log('Gelecek veri sayısı:', count);
    }, [consumData, selectedFeed, zamanTipi]); // 👈 consumData eklendi

    const mixedChart: any = {
        series: [
            {
                name: t('Warehouse Stock'),
                type: 'area',
                data: consumData.length > 0 ? consumData.map((d) => d.depoStok) : [0],
                forecastDataPoints: {
                    // <-- YENİ
                    count: futureCount, // kaç nokta gelecek?
                    dashArray: 5, // kesik çizgi uzunluğu
                    fillOpacity: 0.15, // alan rengi daha soluk
                },
            },
            {
                name: t('Consumption'),
                type: 'line',
                data: consumData.length > 0 ? consumData.map((d) => d.tuketimKg) : [0],
                forecastDataPoints: {
                    count: futureCount,
                    dashArray: 5,
                },
            },
        ],
        options: {
            chart: {
                id: 'consumption-mixed',
                type: 'line', // <-- Hata buradan çıkıyordu
                height: 300,
                zoom: { enabled: false },
                toolbar: { show: false },
            },

            /*  forecastDataPoints artık doğru yerde  */
            forecastDataPoints: {
                count: futureCount, // son N noktayı tahmin olarak işaretle
                dashArray: 5,
                fillOpacity: 0.15,
            },
            dataLabels: {
                enabled: false,
            },
            colors: ['#00ab55', '#4361ee'],
            stroke: {
                width: [2, 2],
                curve: 'smooth',
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            fill: {
                opacity: [0.25, 1],
            },
            labels: consumData.length > 0 ? consumData?.map((item) => item.zamanGrubu) : [0],
            markers: {
                size: 0,
            },
            xaxis: {
                type: 'string',
                axisBorder: {
                    color: isDark ? '#191e3a' : '#e0e6ed',
                },
            },
            yaxis: {
                title: {
                    text: t('Consumption (kg)'),
                },
                min: 0,
            },
            grid: {
                borderColor: isDark ? '#191e3a' : '#e0e6ed',
            },
            tooltip: {
                shared: true,
                intersect: false,
                theme: isDark ? 'dark' : 'light',
            },
            legend: {
                itemMargin: {
                    horizontal: 4,
                    vertical: 8,
                },
            },
        },
    };

    const AddConsumption = async (value: DefData) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        try {
            const response = await axios.post('http://localhost:3030/api/depo/postSevkKayidiEkle', {
                firmaID: userInfo.firmaID,
                yemID: value.yemID,
                miktarKg: value.tuketimMiktari,
                aciklama: value.aciklama,
                kullaniciID: userInfo.kullaniciID,
                islemNedeniID: 8,
            });

            console.log(response.data);
            toast.fire({
                icon: 'success',
                title: 'Başvuru Başarı İle Alıdı',
                padding: '10px 20px',
            });
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(t('An error occurred while saving!') + error);
        }
    };

    return (
        <>
            <div className="grid lg:grid-cols-1 gap-6 mb-6">
                <div className="panel h-full p-0 lg:col-span-1">
                    <div className="flex items-start justify-between dark:text-white-light mb-5 p-5 border-b  border-white-light dark:border-[#1b2e4b]">
                        <h5 className="font-semibold text-lg ">{t('Consumption Chart of the Selected Product and Forecast Based on Average Consumption')}</h5>
                        <div className="dropdown">
                            <Dropdown offset={[0, 5]} btnClassName="hover:text-primary" button={<IconHorizontalDots className="text-black/70 dark:text-white/70 hover:!text-primary" />}>
                                <ul>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('haftalik')}>
                                            {t('Weekly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('aylik')}>
                                            {t('Monthly')}
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setzamanTipi('yillik')}>
                                            {t('Yearly')}
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>

                    {loading ? (
                        <div className="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                            <span className="animate-spin border-2 border-black dark:border-white !border-l-transparent  rounded-full w-5 h-5 inline-flex"></span>
                        </div>
                    ) : (
                        <ReactApexChart series={mixedChart.series} options={mixedChart.options} className="rounded-lg bg-white dark:bg-black overflow-hidden" type="bar" height={300} />
                    )}
                </div>
            </div>
            <div className="p-5">
                <div>
                    <Formik
                        enableReinitialize={true}
                        initialValues={{
                            yemID: selectedData?.yemID || '',
                            tuketimMiktari: selectedData?.tuketimMiktari || '',
                            aciklama: selectedData?.aciklama || '',
                        }}
                        validationSchema={submitFormValidation}
                        onSubmit={() => {}}
                    >
                        {({ errors, submitCount, touched, values }) => (
                            <Form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-1 gap-5">
                                        <div>
                                            <label htmlFor="yemID">{t('Feed Selection')}</label>
                                            <Field name="yemID" component={UnitSelect} options={unitOpitons} />
                                            {submitCount ? errors.yemID ? <div className="text-danger mt-1">{errors.yemID}</div> : <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div> : ''}
                                        </div>
                                        <div>
                                            <label htmlFor="tuketimMiktari">{t('Consumption (kg)')}</label>
                                            <Field name="tuketimMiktari" id="tuketimMiktari" type="number" step="0.01" className="form-input" />
                                            {submitCount ? (
                                                errors.tuketimMiktari ? (
                                                    <div className="text-danger mt-1">{errors.tuketimMiktari?.toString()}</div>
                                                ) : (
                                                    <div className="text-[#1abc9c] mt-1">{t('Looks Good!')}</div>
                                                )
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="aciklama">{t('Description')}</label>
                                            <Field as="textarea" name="aciklama" id="aciklama" className="form-input" />
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
                                                    AddConsumption(values);
                                                }}
                                            >
                                                {t('Save')}
                                            </button>
                                            <button
                                                type="reset"
                                                className="btn btn-danger !mt-6"
                                                onClick={() => {
                                                    setSelectedFeed(null);
                                                }}
                                            >
                                                {t('Cancel')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
};

export default TuketimKayit;

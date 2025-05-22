import { useTranslation } from 'react-i18next';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import IconBell from '../../../../components/Icon/IconBell';
import IconXCircle from '../../../../components/Icon/IconXCircle';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import 'tippy.js/dist/tippy.css';
import { Dialog, Transition } from '@headlessui/react';
import IconX from '../../../../components/Icon/IconX';
import ReactApexChart from 'react-apexcharts';
import { IRootState } from '../../../../store';
import { useNavigate } from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../../../../components/Dropdown';
import IconHorizontalDots from '../../../../components/Icon/IconHorizontalDots';
import IconPlus from '../../../../components/Icon/IconPlus';
import IconMail from '../../../../components/Icon/IconMail';
import IconChecks from '../../../../components/Icon/IconChecks';
import IconServer from '../../../../components/Icon/IconServer';
import IconFile from '../../../../components/Icon/IconFile';
import { colors } from 'react-select/dist/declarations/src/theme';
import StokAnaliz from '../../../../components/YemDetay/StokAnaliz';
import ToplamStokAnaliz from '../../../../components/YemAnalizi/ToplamStokAnaliz';
import TuketimGrafigi from '../../../../components/YemAnalizi/TuketimGrafigi';
import MevcutStokDagilimi from '../../../../components/YemAnalizi/MevcutStokDagilimi';
import TuketimNeden from '../../../../components/YemAnalizi/TuketimNeden';
import BesinKarsilama from '../../../../components/YemAnalizi/BesinKarsilama';
import KPIKart from '../../../../components/YemAnalizi/KPIKart';
import NetTuketimChart from '../../../../components/YemAnalizi/NetTuketimChart';
import GirisCikisChart from '../../../../components/YemAnalizi/GirisCikisChart';

const MultipleTables = () => {
    return (
        <div className="flex flex-col gap-4">
            <ToplamStokAnaliz />
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-2">
                    <TuketimGrafigi />
                </div>
                <div className="col-span-1">
                    <MevcutStokDagilimi />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-1">
                    <NetTuketimChart />
                </div>
                <div className="col-span-2">
                    <TuketimNeden />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-1">
                    <KPIKart />
                </div>
                <div className="col-span-2">
                    <BesinKarsilama />
                </div>
            </div>
            <div>
                <GirisCikisChart />
            </div>
        </div>
    );
};

export default MultipleTables;

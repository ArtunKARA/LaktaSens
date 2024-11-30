import path from 'path';
import { lazy } from 'react';
import AuthGuard from './AuthGuard';
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const CifciDashboard = lazy(() => import('../pages/Cifci/CifciDashboard'));
const GenelTakip = lazy(() => import('../pages/Cifci/GenelTakip'));
const SagmalTakip = lazy(() => import('../pages/Cifci/SagmalTakip'));
const KuruTakip = lazy(() => import('../pages/Cifci/KuruTakip')); 
const GebeTakip = lazy(() => import('../pages/Cifci/GebeTakip')); 
const ServisTakip = lazy(() => import('../pages/Cifci/ServisTakip')); 
const CikarilacaklarTakip = lazy(() => import('../pages/Cifci/CikarilacaklarTakip'));
const GenelTakipDetay = lazy(() => import('../pages/Cifci/GenelTakipDetay'));
const InekEkle= lazy(() => import('../pages/Cifci/InekEkle'));
const ServisTakipDetay= lazy(() => import('../pages/Cifci/ServisTakipDetay'));
const GomuluSensor= lazy(() => import('../pages/Cifci/GomuluSensor'));
const SicaklikSensorTakip= lazy(() => import('../pages/Cifci/SicaklikSensorTakip'));
const InekSicaklikSensorTakip= lazy(() => import('../pages/Cifci/InekSicaklikSensorTakip'));
const NemSensorTakip= lazy(() => import('../pages/Cifci/NemSensorTakip'));
const AdminBasvuruDuzenleme= lazy(() => import('../pages/Cifci/AdminBasvuruDuzenleme'))
const KayitSayfasi = lazy(() => import('../pages/Authentication/KayitSayfasi'));
const routes = [
    //login page
    {
        path: '/',
        element: <LoginBoxed />,
        layout : 'blank',
    },
    // register page
    {
        path: '/register',
        element: <KayitSayfasi />,
        layout : 'blank',
    },
    //farmer dashboard
    {
        path: '/cifci/dashboard',
        element:<AuthGuard allowedRoles={['c']}><CifciDashboard /></AuthGuard>,
        layout : 'cifci',
    },
    //farmer general follow page
    {
        path: '/cifci/GenelTakip',
        element: <AuthGuard allowedRoles={['c']}><GenelTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //farmer sagmal follow page
    {
        path: '/cifci/SagmalTakip',
        element: <AuthGuard allowedRoles={['c']}><SagmalTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //farmer kuru follow page
    {
        path: '/cifci/KuruTakip',
        element: <AuthGuard allowedRoles={['c']}><KuruTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //farmer gebe follow page
    {
        path: '/cifci/GebeTakip',
        element: <AuthGuard allowedRoles={['c']}><GebeTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer servis takip sayfası
    {
        path: '/cifci/ServisTakip',
        element: <AuthGuard allowedRoles={['c']}><ServisTakip /></AuthGuard>,
        layout : 'cifci',
    },
    // Farmer çıkarılacaklar takip sayfası
    {
        path: '/cifci/CikarilacaklarTakip',
        element: <AuthGuard allowedRoles={['c']}><CikarilacaklarTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer genel takip detay sayfası
    {
        path: '/cifci/GenelTakipDetay',
       element: <GenelTakipDetay />,
        layout : 'cifci',
    },
    //Farmer inek ekle sayfası
    {
        path: '/cifci/InekEkle',
        element: <InekEkle />,
        layout : 'cifci',
    },
    //Farmer servis detay sayfası
    {
        path: '/cifci/ServisTakipDetay',
        element: <ServisTakipDetay />,
        layout : 'cifci',
    },
    //Farmer gomuluSensor sayfası
    {
            path: '/cifci/GomuluSensor',
            element: <GomuluSensor />,
            layout : 'cifci',
    },
    //Farmer sıcaklık sensor takip sayfası
    {
        path: '/cifci/SicaklikSensorTakip',
        element: <SicaklikSensorTakip />,
        layout : 'cifci',
    },
      //Farmer nem sensor takip sayfası
      {
        path: '/cifci/NemSensorTakip',
        element: <NemSensorTakip />,
        layout : 'cifci',
    },
      //Farmer inek sıcaklık sensor takip sayfası
      {
        path: '/cifci/InekSicaklikSensorTakip',
        element: <InekSicaklikSensorTakip />,
        layout : 'cifci',
    },
       //Admin basvuru düzenlemesayfası
       {
        path: '/cifci/AdminBasvuruDuzenleme',
        element: <AdminBasvuruDuzenleme />,
        layout : 'cifci',
    },
];

export { routes };

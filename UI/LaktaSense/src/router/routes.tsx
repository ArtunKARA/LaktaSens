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
const AhirSensorTakip= lazy(() => import('../pages/Cifci/AhirSensorTakip'));
const SicaklikSensorTakip= lazy(() => import('../pages/Cifci/SicaklikSensorTakip'));
const AhirSensorDetay= lazy(() => import('../pages/Cifci/AhirSensorDetay'));
const InekSensorDetay= lazy(() => import('../pages/Cifci/InekSensorDetay'));
const SensorEkle= lazy(() => import('../pages/Cifci/SensorEkle'));
const DepoSicaklikSensorTakip= lazy(() => import('../pages/Cifci/DepoSicaklikSensorTakip'));
const DepoSensorTakip= lazy(() => import('../pages/Cifci/DepoSensorTakip'))
const AdminBasvuruDuzenleme= lazy(() => import('../pages/Cifci/AdminBasvuruDuzenleme'))
const YenidoganTakip= lazy(() => import('../pages/Cifci/YenidoganTakip'))
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
    //Farmer AhırSensorTakip sayfası
    {
            path: '/cifci/AhirSensorTakip',
            element: <AhirSensorTakip />,
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
        path: '/cifci/InekSensorDetay',
        element: <InekSensorDetay />,
        layout : 'cifci',
    },
      //Farmer inek sıcaklık sensor takip sayfası
      {
        path: '/cifci/AhirSensorDetay',
        element: <AhirSensorDetay />,
        layout : 'cifci',
    },
       //Admin basvuru düzenlemesayfası
       {
        path: '/cifci/AdminBasvuruDuzenleme',
        element: <AdminBasvuruDuzenleme />,
        layout : 'cifci',
    },
        //Depo sensor takip ayfası
        {
            path: '/cifci/DepoSensorTakip',
            element: <DepoSensorTakip />,
            layout : 'cifci',
        },

         //Farmer depo sıcaklık sensor takip sayfası
    {
        path: '/cifci/DepoSicaklikSensorTakip',
        element: <DepoSicaklikSensorTakip />,
        layout : 'cifci',
    },
      //Farmer depo nem sensor takip sayfası
      {
        path: '/cifci/SensorEkle',
        element: <SensorEkle />,
        layout : 'cifci',
    },
//Yenidoğan takip takip sayfası
{
  path: '/cifci/YenidoganTakip',
  element: <YenidoganTakip />,
  layout : 'cifci',
},
    
];

export { routes };

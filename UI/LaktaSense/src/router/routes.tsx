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
const Cikarilanlar = lazy(() => import('../pages/Cifci/Cikarilacaklanlar'));
const Profil = lazy(() => import('../pages/Cifci/Profil'));
const BasvuruDurum = lazy(() => import('../pages/Authentication/BasvuruDurum'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const TedarikçiBasvuru = lazy(() => import('../pages/Admin/TedarikciBasvuru'));
const CiflikBasvuru = lazy(() => import('../pages/Admin/CiflikBasvuru'));
const AdminProfil = lazy(() => import('../pages/Admin/AdminProfil'));
const AktifCiflik = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/AktifCiflikler'));
const PasifCiflik = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/PasifCiflikler'));
const AktifTedarikci = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/AktifTedarikciler'));
const PasifTedarikci = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/PasifTedarikciler'));
const CiflikDetay = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/CiflikDetay'));
const TedarikciDetay = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/TedarikciDetay'));
const FatruaOnizleme = lazy(() => import('../pages/Admin/HesapYonetimi/FatruaOnizleme'));
const FaturaDetay = lazy(() => import('../pages/Admin/HesapYonetimi/FaturaDetay'));





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
    // BasvuruDurum
    {
        path: '/basvuruDurum',
        element: <BasvuruDurum />,
        layout : 'blank',
    },

    //Çiftçi
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
       element: <AuthGuard allowedRoles={['c']}><GenelTakipDetay /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer inek ekle sayfası
    {
        path: '/cifci/InekEkle',
        element: <AuthGuard allowedRoles={['c']}><InekEkle /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer servis detay sayfası
    {
        path: '/cifci/ServisTakipDetay',
        element: <AuthGuard allowedRoles={['c']}><ServisTakipDetay /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer AhırSensorTakip sayfası
    {
        path: '/cifci/AhirSensorTakip',
        element: <AuthGuard allowedRoles={['c']}><AhirSensorTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer sıcaklık sensor takip sayfası
    {
        path: '/cifci/SicaklikSensorTakip',
        element: <AuthGuard allowedRoles={['c']}><SicaklikSensorTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer nem sensor takip sayfası
    {
        path: '/cifci/InekSensorDetay',
        element: <AuthGuard allowedRoles={['c']}><InekSensorDetay /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer inek sıcaklık sensor takip sayfası
    {
        path: '/cifci/AhirSensorDetay',
        element: <AuthGuard allowedRoles={['c']}><AhirSensorDetay /></AuthGuard>,
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
        element: <AuthGuard allowedRoles={['c']}><DepoSensorTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer depo sıcaklık sensor takip sayfası
    {
        path: '/cifci/DepoSicaklikSensorTakip',
        element: <AuthGuard allowedRoles={['c']}><DepoSicaklikSensorTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Farmer depo nem sensor takip sayfası
    {
        path: '/cifci/SensorEkle',
        element: <AuthGuard allowedRoles={['c']}><SensorEkle /></AuthGuard>,
        layout : 'cifci',
    },
    //Yenidoğan takip takip sayfası
    {
        path: '/cifci/YenidoganTakip',
        element: <AuthGuard allowedRoles={['c']}><YenidoganTakip /></AuthGuard>,
        layout : 'cifci',
    },
    //Cikarilanlar takip takip sayfası
    {
        path: '/cifci/Cikarilanlar',
        element: <AuthGuard allowedRoles={['c']}><Cikarilanlar /></AuthGuard>,
        layout : 'cifci',
    },
    //Profil takip takip sayfası
    {
        path: '/cifci/Profil',
        element: <AuthGuard allowedRoles={['c']}><Profil /></AuthGuard>,
        layout : 'cifci',
    },

    //Admin
    //Admin Dashboard
    {
        path: '/admin/dashboard',
        element:<AuthGuard allowedRoles={['a']}><AdminDashboard /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/TedarikçiBasvuru',
        element:<AuthGuard allowedRoles={['a']}><TedarikçiBasvuru /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/CiflikBasvuru',
        element:<AuthGuard allowedRoles={['a']}><CiflikBasvuru /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/profil',
        element:<AuthGuard allowedRoles={['a']}><AdminProfil /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/AktifCiflik',
        element:<AuthGuard allowedRoles={['a']}><AktifCiflik /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/PasifCiflik',
        element:<AuthGuard allowedRoles={['a']}><PasifCiflik /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/AktifTedarikci',
        element:<AuthGuard allowedRoles={['a']}><AktifTedarikci /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/PasifTedarikci',
        element:<AuthGuard allowedRoles={['a']}><PasifTedarikci /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/CiflikDetay',
        element:<AuthGuard allowedRoles={['a']}><CiflikDetay /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/TedarikciDetay',
        element:<AuthGuard allowedRoles={['a']}><TedarikciDetay /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/FatruaOnizleme',
        element:<AuthGuard allowedRoles={['a']}><FatruaOnizleme /></AuthGuard>,
        layout : 'admin',
    },
    {
        path: '/admin/FaturaDetay',
        element:<AuthGuard allowedRoles={['a']}><FaturaDetay /></AuthGuard>,
        layout : 'admin',
    },


    //Tedarikçi
    //Tedarikçi Dashboard
    {
        path: '/tedarikci/dashboard',
        element:<AuthGuard allowedRoles={['t']}><AdminDashboard /></AuthGuard>,
        layout : 'tedarikci',
    },
];

export { routes };

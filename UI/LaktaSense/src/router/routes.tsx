import path from 'path';
import { lazy } from 'react';
import AuthGuard from './AuthGuard';
import CifciYemMarket from '../pages/Cifci/CifciYemMarket';
const LandingPage = lazy(() => import('../pages/home/page'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const CifciDashboard = lazy(() => import('../pages/Cifci/CifciDashboard'));
const CifciAIOverview = lazy(() => import('../pages/Cifci/AI/AIOverview'));
const CifciAIPredictions = lazy(() => import('../pages/Cifci/AI/AIPredictions'));
const CifciAIAnomalies = lazy(() => import('../pages/Cifci/AI/AIAnomalies'));
const CifciAIRiskScores = lazy(() => import('../pages/Cifci/AI/AIRiskScores'));
const CifciAIRecommendationCenter = lazy(() => import('../pages/Cifci/AI/AIRecommendationCenter'));
const GenelTakip = lazy(() => import('../pages/Cifci/GenelTakip'));
const SagmalTakip = lazy(() => import('../pages/Cifci/SagmalTakip'));
const KuruTakip = lazy(() => import('../pages/Cifci/KuruTakip'));
const GebeTakip = lazy(() => import('../pages/Cifci/GebeTakip'));
const ServisTakip = lazy(() => import('../pages/Cifci/ServisTakip'));
const CikarilacaklarTakip = lazy(() => import('../pages/Cifci/CikarilacaklarTakip'));
const GenelTakipDetay = lazy(() => import('../pages/Cifci/GenelTakipDetay'));
const InekEkle = lazy(() => import('../pages/Cifci/InekEkle'));
const ServisTakipDetay = lazy(() => import('../pages/Cifci/ServisTakipDetay'));
const AhirSensorTakip = lazy(() => import('../pages/Cifci/AhirSensorTakip'));
const SicaklikSensorTakip = lazy(() => import('../pages/Cifci/SicaklikSensorTakip'));
const AhirSensorDetay = lazy(() => import('../pages/Cifci/AhirSensorDetay'));
const InekSensorDetay = lazy(() => import('../pages/Cifci/InekSensorDetay'));
const SensorEkle = lazy(() => import('../pages/Cifci/SensorEkle'));
const DepoSicaklikSensorTakip = lazy(() => import('../pages/Cifci/DepoSicaklikSensorTakip'));
const DepoSensorTakip = lazy(() => import('../pages/Cifci/DepoSensorTakip'));
const AdminBasvuruDuzenleme = lazy(() => import('../pages/Cifci/AdminBasvuruDuzenleme'));
const YenidoganTakip = lazy(() => import('../pages/Cifci/YenidoganTakip'));
const KayitSayfasi = lazy(() => import('../pages/Authentication/KayitSayfasi'));
const Cikarilanlar = lazy(() => import('../pages/Cifci/Cikarilacaklanlar'));
const Profil = lazy(() => import('../pages/Cifci/Profil'));
const BasvuruDurum = lazy(() => import('../pages/Authentication/BasvuruDurum'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const TedarikçiBasvuru = lazy(() => import('../pages/Admin/Basvurular/TedarikciBasvuru'));
const CiflikBasvuru = lazy(() => import('../pages/Admin/Basvurular/CiflikBasvuru'));
const AdminProfil = lazy(() => import('../pages/Admin/AdminProfil'));
const AktifCiflik = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/AktifCiflikler'));
const PasifCiflik = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/PasifCiflikler'));
const AktifTedarikci = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/AktifTedarikciler'));
const PasifTedarikci = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/PasifTedarikciler'));
const CiflikDetay = lazy(() => import('../pages/Admin/HesapYonetimi/Cifci/CiflikDetay'));
const TedarikciDetay = lazy(() => import('../pages/Admin/HesapYonetimi/Tedarikci/TedarikciDetay'));
const FatruaOnizleme = lazy(() => import('../pages/Admin/HesapYonetimi/FatruaOnizleme'));
const FaturaDetay = lazy(() => import('../pages/Admin/HesapYonetimi/FaturaDetay'));
const AdminOlcuTanımları = lazy(() => import('../pages/Admin/Parametreler/Birimler/OlcuTanımları'));
const TedarikciProfil = lazy(() => import('../pages/Tedarikci/Profil'));
const AdminBesinTanımlamaları = lazy(() => import('../pages/Admin/Parametreler/Birimler/BesinTanımları'));
const AdminStandartYemler = lazy(() => import('../pages/Admin/Parametreler/YemTanımlamaları/StandartYemler'));
const AdminBesinDeğerleri = lazy(() => import('../pages/Admin/Parametreler/YemTanımlamaları/Besinİhtiyaçları'));
const AdminStandartYemlerDetay = lazy(() => import('../pages/Admin/Parametreler/YemTanımlamaları/StandartYemlerDetaylar'));
const AdminBesinDeğerleriDetay = lazy(() => import('../pages/Admin/Parametreler/YemTanımlamaları/BesinİhtiyaçlarıDetaylar'));
const TedarikciYemTanımlamaları = lazy(() => import('../pages/Tedarikci/UrunTanımlamalar/YemTanımlamaları'));
const TedarikciYemTanımlamalarıDetay = lazy(() => import('../pages/Tedarikci/UrunTanımlamalar/YemTanımlamalarıDetay'));
const AdminYemBasvurulari = lazy(() => import('../pages/Admin/Basvurular/Yem/YemBasvurulari'));
const AdminYemBasvurulariDetay = lazy(() => import('../pages/Admin/Basvurular/Yem/YemBasvuruDetay'));
const CifciDepoTakipStok = lazy(() => import('../pages/Cifci/DepoModul/DepoTakip/Stok'));
const CifciDepoTakipTüketim = lazy(() => import('../pages/Cifci/DepoModul/DepoTakip/TüketimGecmisi'));
const CifciDepoTakipMalKabul = lazy(() => import('../pages/Cifci/DepoModul/DepoTakip/MalKabulGecmisi'));
const CifciDepoTakipSevk = lazy(() => import('../pages/Cifci/DepoModul/DepoTakip/SevkGecmisi'));
const TedarikciDepoTakipStok = lazy(() => import('../pages/Tedarikci/DepoModul/DepoTakip/Stok'));
const TedarikciDepoTakipMalKabul = lazy(() => import('../pages/Tedarikci/DepoModul/DepoTakip/MalKabulGecmisi'));
const TedarikciDepoTakipSevk = lazy(() => import('../pages/Tedarikci/DepoModul/DepoTakip/SevkGecmisi'));
const CifciTuketimKaydi = lazy(() => import('../pages/Cifci/DepoModul/TuketimKaydi'));
const CifciMalKabul = lazy(() => import('../pages/Cifci/DepoModul/CifciMalKabul'));
const CifciSevk = lazy(() => import('../pages/Cifci/DepoModul/CifciMalSevk'));
const TedarikciMalKabul = lazy(() => import('../pages/Tedarikci/DepoModul/TedarikciMalKabul'));
const TedarikciSevk = lazy(() => import('../pages/Tedarikci/DepoModul/TedarikciSevk'));
const CifciYemDetay = lazy(() => import('../pages/Cifci/CifciYemDetay'));
const CifciTuketimAnalizi = lazy(() => import('../pages/Cifci/DepoModul/YemAnalizi/TuketimAnalizi'));
const CifciTedarikAnalizi = lazy(() => import('../pages/Cifci/DepoModul/YemAnalizi/TedarikAnalizi'));
const CifciIhtiyacAnalizi = lazy(() => import('../pages/Cifci/DepoModul/YemAnalizi/IhtiyacAnalizi'));
const CifciTedarikIhaleBaslat = lazy(() => import('../pages/Cifci/Tedarik/IhaleBaslat'));
const CifciTedarikIhalelerim = lazy(() => import('../pages/Cifci/Tedarik/Ihale'));
const CifciTedarikIhaleDetay = lazy(() => import('../pages/Cifci/Tedarik/IhaleDetay'));
const CifciTedarikMarket = lazy(() => import('../pages/Cifci/Tedarik/Market'));
const CifciTedarikSiparis = lazy(() => import('../pages/Cifci/Tedarik/Siparis'));
const TedarikciAcikIhaleler = lazy(() => import('../pages/Tedarikci/Siparis/AcikIhaleler'));
const TedarikciIhalelerim = lazy(() => import('../pages/Tedarikci/Siparis/Ihalelerim'));

const routes = [
    //landing page
    {
        path: '/',
        element: <LandingPage />,
        layout: 'blank',
    },
    //login page
    {
        path: '/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    // register page
    {
        path: '/register',
        element: <KayitSayfasi />,
        layout: 'blank',
    },
    // BasvuruDurum
    {
        path: '/basvuruDurum',
        element: <BasvuruDurum />,
        layout: 'blank',
    },

    //Çiftçi
    //farmer dashboard
    {
        path: '/cifci/dashboard',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciDashboard />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/ai/ozet',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciAIOverview />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/ai/tahminler',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciAIPredictions />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/ai/anomaliler',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciAIAnomalies />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/ai/risk-skorlari',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciAIRiskScores />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/ai/oneriler',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciAIRecommendationCenter />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //farmer general follow page
    {
        path: '/cifci/GenelTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <GenelTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //farmer sagmal follow page
    {
        path: '/cifci/SagmalTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <SagmalTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //farmer kuru follow page
    {
        path: '/cifci/KuruTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <KuruTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //farmer gebe follow page
    {
        path: '/cifci/GebeTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <GebeTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer servis takip sayfası
    {
        path: '/cifci/ServisTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <ServisTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    // Farmer çıkarılacaklar takip sayfası
    {
        path: '/cifci/CikarilacaklarTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CikarilacaklarTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer genel takip detay sayfası
    {
        path: '/cifci/GenelTakipDetay',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <GenelTakipDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer inek ekle sayfası
    {
        path: '/cifci/InekEkle',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <InekEkle />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer servis detay sayfası
    {
        path: '/cifci/ServisTakipDetay',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <ServisTakipDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer AhırSensorTakip sayfası
    {
        path: '/cifci/AhirSensorTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <AhirSensorTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer sıcaklık sensor takip sayfası
    {
        path: '/cifci/SicaklikSensorTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <SicaklikSensorTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer nem sensor takip sayfası
    {
        path: '/cifci/InekSensorDetay',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <InekSensorDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer inek sıcaklık sensor takip sayfası
    {
        path: '/cifci/AhirSensorDetay',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <AhirSensorDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Admin basvuru düzenlemesayfası
    {
        path: '/cifci/AdminBasvuruDuzenleme',
        element: <AdminBasvuruDuzenleme />,
        layout: 'cifci',
    },
    //Depo sensor takip ayfası
    {
        path: '/cifci/DepoSensorTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <DepoSensorTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer depo sıcaklık sensor takip sayfası
    {
        path: '/cifci/DepoSicaklikSensorTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <DepoSicaklikSensorTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Farmer depo nem sensor takip sayfası
    {
        path: '/cifci/SensorEkle',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <SensorEkle />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Yenidoğan takip takip sayfası
    {
        path: '/cifci/YenidoganTakip',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <YenidoganTakip />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Cikarilanlar takip takip sayfası
    {
        path: '/cifci/Cikarilanlar',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <Cikarilanlar />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Profil takip takip sayfası
    {
        path: '/cifci/Profil',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <Profil />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    //Cifci depo takip stok sayfası
    {
        path: '/cifci/DepoTakip/Stok',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciDepoTakipStok />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/DepoTakip/Tüketim',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciDepoTakipTüketim />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/DepoTakip/MalKabul',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciDepoTakipMalKabul />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/DepoTakip/Sevk',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciDepoTakipSevk />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/TuketimKaydi',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTuketimKaydi />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/MalKabul',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciMalKabul />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/Sevk',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciSevk />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/yemDetay',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciYemDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/yemAnaliz/IhtiyacAnalizi',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciIhtiyacAnalizi />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/yemAnaliz/TedarikAnalizi',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikAnalizi />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/yemAnaliz/TuketimAnalizi',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTuketimAnalizi />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/tedarik/ihale-baslat',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikIhaleBaslat />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/tedarik/ihalelerim',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikIhalelerim />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/tedarik/ihale/:ihaleID',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikIhaleDetay />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/tedarik/market',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikMarket />
            </AuthGuard>
        ),
        layout: 'cifci',
    },
    {
        path: '/cifci/tedarik/siparis',
        element: (
            <AuthGuard allowedRoles={['c']}>
                <CifciTedarikSiparis />
            </AuthGuard>
        ),
        layout: 'cifci',
    },

    //Admin
    //Admin Dashboard
    {
        path: '/admin/dashboard',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminDashboard />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/TedarikçiBasvuru',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <TedarikçiBasvuru />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/CiflikBasvuru',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <CiflikBasvuru />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/profil',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminProfil />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/AktifCiflik',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AktifCiflik />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/PasifCiflik',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <PasifCiflik />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/AktifTedarikci',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AktifTedarikci />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/PasifTedarikci',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <PasifTedarikci />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/CiflikDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <CiflikDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/TedarikciDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <TedarikciDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/FatruaOnizleme',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <FatruaOnizleme />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/FaturaDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <FaturaDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/olcu',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminOlcuTanımları />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/besin',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminBesinTanımlamaları />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/standartYemler',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminStandartYemler />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/standartYemlerDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminStandartYemlerDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/gerekliBesinDeğerleri',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminBesinDeğerleri />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/parameter/gerekliBesinDeğerleriDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminBesinDeğerleriDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/YemBasvurulari',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminYemBasvurulari />
            </AuthGuard>
        ),
        layout: 'admin',
    },
    {
        path: '/admin/YemBasvurulariDetay',
        element: (
            <AuthGuard allowedRoles={['a']}>
                <AdminYemBasvurulariDetay />
            </AuthGuard>
        ),
        layout: 'admin',
    },

    //Tedarikçi
    //Tedarikçi Dashboard
    {
        path: '/tedarikci/dashboard',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <AdminDashboard />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/profil',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciProfil />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/tanımlamalar/yem',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciYemTanımlamaları />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/tanımlamalar/yemDetay',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciYemTanımlamalarıDetay />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/DepoTakip/Sevk',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciDepoTakipSevk />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/DepoTakip/Stok',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciDepoTakipStok />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/DepoTakip/MalKabul',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciDepoTakipMalKabul />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/MalKabul',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciMalKabul />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/Sevk',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciSevk />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/AcikIhaleler',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciAcikIhaleler />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
    {
        path: '/tedarikci/Ihalelerim',
        element: (
            <AuthGuard allowedRoles={['t']}>
                <TedarikciIhalelerim />
            </AuthGuard>
        ),
        layout: 'tedarikci',
    },
];

export { routes };

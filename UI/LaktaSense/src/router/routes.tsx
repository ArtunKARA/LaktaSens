import path from 'path';
import { lazy } from 'react';
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const CifciDashboard = lazy(() => import('../pages/Cifci/CifciDashboard'));
const GenelTakip = lazy(() => import('../pages/Cifci/GenelTakip'));
const SagmalTakip = lazy(() => import('../pages/Cifci/SagmalTakip'));
const KuruTakip = lazy(() => import('../pages/Cifci/KuruTakip')); 
const GebeTakip = lazy(() => import('../pages/Cifci/GebeTakip')); 
const ServisTakip = lazy(() => import('../pages/Cifci/ServisTakip')); 
const CikarilacaklarTakip = lazy(() => import('../pages/Cifci/CikarilacaklarTakip'));
const GenelTakipDetay = lazy(() => import('../pages/Cifci/GenelTakipDetay'));
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
        element: <CifciDashboard />,
        layout : 'cifci',
    },
    //farmer general follow page
    {
        path: '/cifci/GenelTakip',
        element: <GenelTakip />,
        layout : 'cifci',
    },
    //farmer sagmal follow page
    {
        path: '/cifci/SagmalTakip',
        element: <SagmalTakip />,
        layout : 'cifci',
    },
    //farmer kuru follow page
    {
        path: '/cifci/KuruTakip',
        element: <KuruTakip />,
        layout : 'cifci',
    },
    //farmer gebe follow page
    {
        path: '/cifci/GebeTakip',
        element: <GebeTakip />,
        layout : 'cifci',
    },
    {
        path: '/cifci/ServisTakip',
        element: <ServisTakip />,
        layout : 'cifci',
    },
    {
        path: '/cifci/CikarilacaklarTakip',
        element: <CikarilacaklarTakip />,
        layout : 'cifci',
    },
    {
        path: '/cifci/GenelTakipDetay',
        element: <GenelTakipDetay />,
        layout : 'cifci',
    },
];

export { routes };

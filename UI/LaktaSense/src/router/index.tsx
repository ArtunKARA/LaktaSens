import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import CifciLayout from '../components/Layouts/CifciLayout';
import TedarikciLayout from '../components/Layouts/TedarikciLayout';
import AdminLayout from '../components/Layouts/AdminLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    let element;

    switch (route.layout) {
        case 'blank':
            element = <BlankLayout>{route.element}</BlankLayout>;
            break;
        case 'cifci':
            element = <CifciLayout>{route.element}</CifciLayout>;
            break;
        case 'tedarikci':
            element = <TedarikciLayout>{route.element}</TedarikciLayout>;
            break;
        case 'admin':
            element = <AdminLayout>{route.element}</AdminLayout>;
            break;
        default:
            element = <DefaultLayout>{route.element}</DefaultLayout>;
            break;
    }

    return {
        ...route,
        element,
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;

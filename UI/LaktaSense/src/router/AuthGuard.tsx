import React from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles: string[]; // Erişim izni olan roller
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
    // Kullanıcı bilgilerini localStorage'dan al
    const userInfo = localStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    // Kullanıcı giriş yapmış mı ve yetkisi var mı kontrol et
    if (!user || !allowedRoles.includes(user.kullaniciTuru)) {
        return <Navigate to="/" />; // Yetkisi yoksa yetkisiz sayfasına yönlendir
    }

    // Yetki varsa içerik göster
    return <>{children}</>;
};

export default AuthGuard;

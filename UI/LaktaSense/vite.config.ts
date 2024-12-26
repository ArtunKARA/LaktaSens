import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            // '/apie' ile başlayan istekleri yönlendir
            '/apie': {
                target: 'https://confoni.com',
                changeOrigin: true, // Proxy başlıklarını ayarlar
                rewrite: (path) => path.replace(/^\/apie/, ''), // '/apie' kısmını kaldır
            },
        },
    },
});

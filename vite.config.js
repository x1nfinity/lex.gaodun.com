import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            // Proxy for DeepSeek API
            '/api/deepseek': {
                target: 'https://api.deepseek.com',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api\/deepseek/, ''),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            },
            // Proxy for Doubao API
            '/api/doubao': {
                target: 'https://ark.cn-beijing.volces.com',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api\/doubao/, ''),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            },
            // Proxy for Aliyun DashScope API
            '/api/aliyun': {
                target: 'https://dashscope.aliyuncs.com',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api\/aliyun/, ''),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DashScope-Async',
                },
            },
        },
    },
});

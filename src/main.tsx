import React from 'react';

import zhCN from 'antd/locale/zh_CN';
import ReactDOM from 'react-dom/client';

import { ConfigProvider, App as AntdApp } from 'antd';

import App from './App';

declare global {
    interface Window {
        useCompatibilityModal: () => void;
        [name: string]: any;
    }
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <ConfigProvider locale={zhCN}>
        <AntdApp>
            <App />
        </AntdApp>
    </ConfigProvider>
);

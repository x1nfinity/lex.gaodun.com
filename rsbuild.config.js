const path = require('path');
const { defineConfig } = require('@rsbuild/core');
const { pluginReact } = require('@rsbuild/plugin-react');
const { pluginSass } = require('@rsbuild/plugin-sass');
const { pluginBasicSsl } = require('@rsbuild/plugin-basic-ssl');
const { pluginSvgr } = require('@rsbuild/plugin-svgr');

const { name } = require('./package.json');

const env = {
    test: 't-',
    prepare: 'pre-',
    production: '',
};

module.exports = defineConfig({
    html: {
        template: './index.html',
        // 变量注入
        templateParameters: {
            PUBLIC_URL: `https://${env[process.env.CROSS_ENV]}lex.gaodun.com/`,
        },
    },
    dev: {
        assetPrefix: '/',
    },
    source: {
        entry: {
            index: './src/main.tsx',
        },
        // 定义环境变量替换
        define: {
            'process.env.CROSS_ENV': JSON.stringify(process.env.CROSS_ENV || 'dev'),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        },
        transformImport: [
            {
                libraryName: 'lodash',
                customName: 'lodash/{{ member }}',
            },
        ],
        decorators: {
            version: 'legacy',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    output: {
        assetPrefix: '/',
        distPath: {
            root: 'dist',
        },
        filename: {
            js: process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].js' : '[name]_script.js',
            css: process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].css' : '[name]_style.css',
        },
        // 生产环境打包不打包react和react-dom
        externals: process.env.NODE_ENV === 'production' ? { react: 'React', 'react-dom': 'ReactDOM' } : {},
    },
    plugins: [
        pluginReact(),
        pluginBasicSsl(), // 生成https证书 截止server的https属性
        pluginSass({
            sassLoaderOptions: {
                sassOptions: {
                    javascriptEnabled: true,
                    math: 'always',
                    modifyVars: {
                        'root-entry-name': 'default',
                    },
                },
            },
        }),
        pluginSvgr({
            svgrOptions: {
                icon: true,
                typescript: true,
                ref: true,
                svgo: true,
                titleProp: true,
                exportType: 'default',
                jsxRuntime: 'automatic',
                mixedImport: true, // 是否开启混合导入，允许同时使用默认导入和命名导入。
                svgoConfig: {
                    exportType: 'named', // 支持具名导入 ReactComponent 来使用 SVGR
                    plugins: [
                        {
                            name: 'preset-default',
                            params: {
                                overrides: {
                                    removeViewBox: false,
                                },
                            },
                        },
                    ],
                },
            },
        }),
    ],
    server: {
        host: 'dev-lex.gaodun.com',
        port: 8123,
        // https: true, // https有ssl接管
        open: 'https://dev-lex.gaodun.com:8123',
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
    performance: {
        removeConsole: true,
        chunkSplit: {
            strategy: 'split-by-experience',
            forceSplitting: {
                axios: /node_modules[\\/]axios/,
                'sa-sdk-javascript': /node_modules[\\/]sa-sdk-javascript/,
            },
        },
    },
    tools: {
        rspack: {
            output: {
                library: `${name}-[name]`,
                libraryTarget: 'umd',
                chunkLoadingGlobal: `webpackJsonp_${name}`,
                globalObject: 'window',
            },
        },
        bundlerChain: (chain, { CHAIN_ID }) => {
            if (process.env.RSDOCTOR) {
                // chain.plugin('Rsdoctor').use(RsdoctorRspackPlugin, [
                //     {
                //         // 插件选项
                //     },
                // ]);
            }
            chain.module
                .rule('font')
                .test(/\.(ttf|otf|svg)$/)
                .include.add(/font/)
                .end()
                .type('asset/resource');
        },
    },
});

import type { Config } from 'tailwindcss';

const config: Config = {
    // 指定需要扫描的文件路径，Tailwind 会从这些文件中提取使用的类名
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    ],

    // 安全列表：确保某些类名不会被 PurgeCSS 清除，即使没有在代码中使用
    safelist: [],

    // 核心插件配置
    corePlugins: {
        preflight: false, // 禁用tailwindcss的css reset，保留浏览器默认样式
    },
};

export default config;

module.exports = {
    extends: ['@gaodun.com/eslint-config-selling/react'],
    settings: {
        'import/resolver': {
            // 让 ESLint 正确识别 tsconfig 的 baseUrl/paths（@/* → src/*）
            typescript: {
                project: ['./tsconfig.json'], // 指向项目根目录下的 tsconfig.json
            },
            node: true,
        },
    },
    plugins: ['import'],
    rules: {
        // 由 ESLint 统一控制 import 顺序
        'import/order': [
            'warn',
            {
                groups: [
                    'builtin', // Node 内置: fs, path...
                    'external', // 第三方: react, antd, lodash...
                    'internal', // 别名: @/*
                    ['parent', 'sibling', 'index'], // 相对路径: ../ ./ index
                    'object', // 少见: import foo = require('foo')
                    'type', // 仅类型导入（TS）
                ],
                // 指定包“插队”/分组细化
                pathGroups: [
                    { pattern: 'react', group: 'external', position: 'before' },
                    { pattern: 'react-dom', group: 'external', position: 'before' },
                    { pattern: 'antd', group: 'external', position: 'after' },
                    { pattern: '@/**', group: 'internal', position: 'after' },

                    // （可选）把样式导入放到文件末尾
                    { pattern: '**/*.+(css|scss)', group: 'index', position: 'after' },
                ],
                pathGroupsExcludedImportTypes: ['react'],
                'newlines-between': 'always', // 组与组之间空一行
                alphabetize: { order: 'asc', caseInsensitive: true }, // 组内按字母序
            },
        ],
        'no-undef': 'off',
        'no-throw-literal': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/sort-comp': 'off',
        'no-return-assign': 'off',
        'no-console': 'off',
        'react-hooks/exhaustive-deps': 0,
        'no-use-before-define': 0,
    },
};

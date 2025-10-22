module.exports = {
    extends: '@gaodun.com/stylelint',
    customSyntax: 'postcss-scss', // scss 这里替换成 postcss-scss
    rules: {
        'block-no-empty': null,
        'function-url-quotes': null,
        'property-no-vendor-prefix': null,
        'selector-id-pattern': null,
        'no-empty-source': null,
        'at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: [
                    'tailwind',
                    'import',
                    'extends',
                    'content',
                    'each',
                    'else',
                    'error',
                    'for',
                    'function',
                    'include',
                    'if',
                    'mixin',
                    'return',
                    'warn',
                    'while',
                    'layer',
                ],
            },
        ],
    },
};

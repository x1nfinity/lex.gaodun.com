const reactConfig = require('./react');

const mergePlugins = (base = [], extras = []) => {
  const seen = new Set();
  return [...base, ...extras].filter(plugin => {
    if (seen.has(plugin)) {
      return false;
    }
    seen.add(plugin);
    return true;
  });
};

const mergeSettings = baseSettings => {
  const resolver = {
    ...(baseSettings?.['import/resolver'] || {}),
    typescript: {
      ...(baseSettings?.['import/resolver']?.typescript || {}),
      project: ['./tsconfig.json'],
    },
    node: true,
  };

  return {
    ...(baseSettings || {}),
    'import/resolver': resolver,
  };
};

module.exports = {
  ...reactConfig,
  settings: mergeSettings(reactConfig.settings),
  plugins: mergePlugins(reactConfig.plugins || [], ['import']),
  rules: {
    ...(reactConfig.rules || {}),
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-dom', group: 'external', position: 'before' },
          { pattern: 'antd', group: 'external', position: 'after' },
          { pattern: '@/**', group: 'internal', position: 'after' },
          { pattern: '**/*.+(css|scss)', group: 'index', position: 'after' },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
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

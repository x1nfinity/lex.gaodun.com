/**
 * selling ESLint 规则
 */

const react = require("./rules/react-common.js");
const reactHooks = require("./rules/react-hooks-common.js");

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    // "jquery": true
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },
  globals: {
    // "wx": "readonly",
  },
  extends: [
    "./base.js",
    "./typescript.js",
    "plugin:prettier/recommended",
    "plugin:oxlint/recommended",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "react-hooks"],
  rules: Object.assign({ "prettier/prettier": "error" }, react, reactHooks),
};

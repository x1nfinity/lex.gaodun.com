"use strict";

const coreRules = require("./rules");
const orderRules = require("./rules/order");

module.exports = {
  extends: [
    "stylelint-config-standard", // 标准配置
  ],
  customSyntax: "postcss-scss",
  plugins: ["stylelint-order"],
  // rules: Object.assign({}, coreRules, orderRules),
  // 详细规则查询：https://stylelint.nodejs.cn/user-guide/rules/
  rules: Object.assign(
    {
      "property-no-unknown": [
        true,
        {
          ignoreProperties: ["//"], // 忽略 SCSS 的单行注释语法
          checkPrefixed: true, // 检查前缀属性
        },
      ],
      // rpx 单位报错
      "unit-no-unknown": null,
      // 禁止未知注释
      "annotation-no-unknown": null,
      // 指定关键帧动画名称的模式小写，关闭
      "keyframes-name-pattern": null,
      // 禁止未知类型选择器
      "selector-type-no-unknown": null,
      // 不允许模块内为空
      "block-no-empty": null,
      // 要求url使用引号
      "function-url-quotes": null,
      // 禁止空源码。
      "no-empty-source": null,
      // @import 规则 字符串 或者 url() 需要禁用
      "import-notation": null,
      // 禁止在规则中使用浏览器前缀
      "at-rule-no-vendor-prefix": null,
      // 禁止属性的浏览器引擎前缀，多行文本溢出省略等需要
      "value-no-vendor-prefix": null,
      // 禁止属性的浏览器引擎前缀，多行文本溢出省略等需要
      "property-no-vendor-prefix": null,
      // 定义的方法名
      "function-no-unknown": null,
      // 限制数字中允许的小数位数
      "number-max-precision": null,
      // 不能用 // 注释
      "no-invalid-double-slash-comments": null,
      // id选择器命名规则
      "selector-id-pattern": null,
      // 类选择器命名规则
      "selector-class-pattern": null,
      // 禁止在具有较高优先级的选择器后出现被其覆盖的较低优先级的选择器
      "no-descending-specificity": null,
      // 属性应该缩写
      "declaration-block-no-redundant-longhand-properties": null,
      // 颜色不进行转换
      "alpha-value-notation": "number",
      // 颜色函数符号 不限制
      "color-function-notation": null,
      // 禁止使用未知的伪类选择器
      "selector-pseudo-class-no-unknown": [
        true,
        {
          ignorePseudoClasses: ["global"],
        },
      ],
      // 在每个不是关键字的字体系列名称周围加上引号
      "font-family-name-quotes": [
        "always-unless-keyword",
        {
          message: "在每个不是关键字的字体系列名称周围加上引号",
        },
      ],
      // 禁止重复的字体系列名称
      "font-family-no-duplicate-names": [
        true,
        {
          message: "禁止重复的字体系列名称",
        },
      ],
      // 禁止在字体系列名称列表中缺少通用系列，关闭
      "font-family-no-missing-generic-family-keyword": null,
      // 不限制font-weight值必须始终是数字
      "font-weight-notation": null,
      // 禁止使用未知的 at 规则,ignoreAtRules 为忽略名单
      "at-rule-no-unknown": [
        true,
        {
          ignoreAtRules: [
            "tailwind",
            "import",
            "extends",
            "content",
            "each",
            "else",
            "error",
            "for",
            "function",
            "include",
            "if",
            "mixin",
            "return",
            "warn",
            "while",
            "layer",
          ],
        },
      ],
    },
    orderRules,
  ),
  overrides: [
    {
      files: ["**/*.scss"],
      customSyntax: "postcss-scss", // SCSS 解析器
      extends: ["stylelint-config-recommended-scss"], // scss 推荐规则
      plugins: [
        "stylelint-scss", // 支持 scss
      ],
      rules: {
        // 引入文件时 不要去掉后缀名
        "scss/load-partial-extension": null,
        // 根据需要调整 SCSS 变量规则
        "scss/dollar-variable-pattern": null,
        // 禁止未知 SCSS @规则
        "scss/at-rule-no-unknown": null,
      },
    },
    {
      files: ["**/*.less"],
      customSyntax: "postcss-less", // Less 解析器
      extends: ["stylelint-config-recommended-less"], // Less 推荐规则
      plugins: [
        "stylelint-less", // 支持 Less
      ],
      rules: {
        // 检查 Less 中无效的颜色值
        "less/color-no-invalid-hex": null,
      },
    },
  ],
};

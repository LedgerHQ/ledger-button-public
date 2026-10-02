import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["public/_pagefind"],
  },
  {
    files: ["**/*.json"],
    rules: {},
    languageOptions: {
      parser: await import("jsonc-eslint-parser"),
    },
  },
];

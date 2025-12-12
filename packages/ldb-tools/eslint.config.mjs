import * as globals from "zx/globals";
import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    files: ["**/*.cjs"],
    globals: {
      ...globals,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": 0,
    },
  },
];

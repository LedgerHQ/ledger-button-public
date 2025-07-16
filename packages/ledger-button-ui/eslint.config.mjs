import nx from "@nx/eslint-plugin";
import storybook from "eslint-plugin-storybook";

import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  ...nx.configs["flat/react"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {},
  },
  ...storybook.configs["flat/recommended"],
];

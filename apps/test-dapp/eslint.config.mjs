import nextPlugin from "@next/eslint-plugin-next";
import nx from "@nx/eslint-plugin";

import baseConfig from "../../eslint.config.mjs";
import { lumenTailwind } from "../../tools/eslint/lumen.mjs";

export default [
  ...baseConfig,
  ...nx.configs["flat/react-typescript"],
  nextPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    ignores: [".next/**/*"],
  },
  ...lumenTailwind({
    entryPoint: "src/app/global.css",
    files: ["src/**/*.{ts,tsx}"],
  }),
];

import { join } from "path";
import { fileURLToPath } from "url";

import { ledgerButtonPreset } from "./src/tailwind-preset.ts";

const __dirname = join(fileURLToPath(import.meta.url), "..");

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerButtonPreset],
  content: [
    join(__dirname, "src/**/*!(*.stories|*.spec).{ts,js,html}"),
    join(
      __dirname,
      "../ledger-button/src/**/*!(*.stories|*.spec).{ts,js,html}",
    ),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    fontSize: false,
    fontWeight: false,
    lineHeight: false,
    letterSpacing: false,
  },
};

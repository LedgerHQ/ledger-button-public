import { join } from "path";

import { ledgerButtonPreset } from "./src/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerButtonPreset],
  content: [
    join(
      __dirname,
      "../ledger-button-ui/src/**/*!(*.stories|*.spec).{ts,js,html}",
    ),
  ],
  theme: {
    extend: {},
  },
};

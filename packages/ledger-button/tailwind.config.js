import { join } from "path";

import { ledgerButtonPreset } from "./src/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerButtonPreset],
  content: [
    join(__dirname, "./src/**/*!(*.stories|*.spec).{ts,js,html}"),
    join(
      __dirname,
      "../ledger-button-ui/src/**/*!(*.stories|*.spec).{ts,js,html}",
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

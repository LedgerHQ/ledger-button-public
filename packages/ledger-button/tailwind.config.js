import { join } from "path";

// eslint-disable-next-line @nx/enforce-module-boundaries
import { ledgerButtonPreset } from "../../tailwind-workspace-preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerButtonPreset],
  content: [join(__dirname, "./src/**/*!(*.stories|*.spec).{ts,js,html}")],
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

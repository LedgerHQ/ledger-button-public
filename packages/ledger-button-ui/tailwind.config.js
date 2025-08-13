import { join } from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line @nx/enforce-module-boundaries
import { ledgerButtonPreset } from "../../tailwind-workspace-preset.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerButtonPreset],
  content: [join(__dirname, "src/**/*!(*.stories|*.spec).{ts,js,html}")],
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

import { ledgerLivePreset } from "@ledgerhq/ldls-design-core";
import { join } from "path";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerLivePreset],
  content: [join(__dirname, "./src/**/*!(*.stories|*.spec).{ts,js,html}")],
  prefix: "lb-",
  theme: {
    extend: {
      backgroundColor: {
        "muted-subtle": "#3C3C3C",
      },
    },
  },
  plugins: [],
  corePlugins: {
    fontSize: false,
    fontWeight: false,
    lineHeight: false,
    letterSpacing: false,
  },
};

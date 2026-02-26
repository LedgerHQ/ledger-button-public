import { ledgerLivePreset } from "@ledgerhq/lumen-design-core";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [ledgerLivePreset],
  content: ["./src/**/*!(*.stories|*.spec).{ts,js,html}"],
};

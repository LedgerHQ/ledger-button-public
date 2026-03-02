/** @type {import("tailwindcss").Config} */
import { ledgerLivePreset } from "@ledgerhq/lumen-design-core";

const tailwindConfig = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@ledgerhq/lumen-ui-react/dist/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [ledgerLivePreset],
};

export default tailwindConfig;
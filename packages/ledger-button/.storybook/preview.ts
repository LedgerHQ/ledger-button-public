import type { Preview } from "@storybook/web-components";

import "@ledgerhq/ledger-button-ui/styles.css";

const preview: Preview = {
  parameters: {
    tags: ["autodocs"],
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;

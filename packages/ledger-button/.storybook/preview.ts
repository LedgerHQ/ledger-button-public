import type { Preview } from "@storybook/web-components";

import "../src/styles.css";

const preview: Preview = {
  globalTypes: {
    mode: {
      description: "Color mode",
      toolbar: {
        title: "Mode",
        icon: "paintbrush",
        items: [
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "light", title: "Light", icon: "sun" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: "dark",
  },
  decorators: [
    (story, context) => {
      const isDark = context.globals.mode !== "light";
      document.body.classList.toggle("dark", isDark);
      return story();
    },
  ],
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

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
    background: {
      description: "Background",
      toolbar: {
        title: "Background",
        icon: "photo",
        items: [
          { value: "canvas", title: "Canvas (theme)" },
          { value: "#ffffff", title: "White" },
          { value: "#000000", title: "Black" },
          { value: "#7c3aed", title: "Purple" },
          { value: "transparent", title: "Transparent" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: "dark",
    background: "canvas",
  },
  decorators: [
    (story, context) => {
      const isDark = context.globals.mode !== "light";
      document.body.classList.toggle("dark", isDark);

      const bg = context.globals.background ?? "canvas";
      document.body.style.backgroundColor =
        bg === "canvas" ? "var(--background-canvas)" : bg;

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

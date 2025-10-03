import "./platform-icon";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Atom/Icon/PlatformIcons",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <platform-icon .platformType=${args.platformType}></platform-icon>
    </div>`,
  argTypes: {
    platformType: {
      control: "select",
      options: ["mobile", "desktop"],
      description: "The platform type to display the corresponding icon",
    },
  },
};

export default meta;
type Story = StoryObj;

export const Mobile: Story = {
  args: {
    platformType: "mobile",
  },
};

export const Desktop: Story = {
  args: {
    platformType: "desktop",
  },
};

export const AllPlatforms: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;"
    >
      <div style="text-align: center;">
        <platform-icon platformType="mobile"></platform-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Mobile</p>
      </div>
      <div style="text-align: center;">
        <platform-icon platformType="desktop"></platform-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Desktop</p>
      </div>
    </div>
  `,
};

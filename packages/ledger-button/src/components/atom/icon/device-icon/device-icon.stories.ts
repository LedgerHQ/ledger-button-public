import "./device-icon";

import { DeviceModelId } from "@ledgerhq/ledger-button-core";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Atom/Icon/DeviceIcons",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <device-icon .modelId=${args.modelId}></device-icon>
    </div>`,
  argTypes: {
    modelId: {
      control: "select",
      options: ["stax", "flex", "nanos", "nanosp", "nanox"],
      description: "The device model ID to display the corresponding icon",
    },
  },
};

export default meta;
type Story = StoryObj;

export const Stax: Story = {
  args: {
    modelId: "stax",
  },
};

export const Flex: Story = {
  args: {
    modelId: "flex",
  },
};

export const NanoS: Story = {
  args: {
    modelId: "nanos",
  },
};

export const NanoSPlus: Story = {
  args: {
    modelId: "nanosp",
  },
};

export const NanoX: Story = {
  args: {
    modelId: "nanox",
  },
};

export const AllDevices: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;"
    >
      <div style="text-align: center;">
        <device-icon modelId=${DeviceModelId.STAX}></device-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Stax</p>
      </div>
      <div style="text-align: center;">
        <device-icon modelId=${DeviceModelId.FLEX}></device-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Flex</p>
      </div>
      <div style="text-align: center;">
        <device-icon modelId=${DeviceModelId.NANO_S}></device-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Nano S</p>
      </div>
      <div style="text-align: center;">
        <device-icon modelId=${DeviceModelId.NANO_SP}></device-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Nano S Plus</p>
      </div>
      <div style="text-align: center;">
        <device-icon modelId=${DeviceModelId.NANO_X}></device-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Nano X</p>
      </div>
    </div>
  `,
};

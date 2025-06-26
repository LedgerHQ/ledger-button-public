import "./ledger-icon-atom";

import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Atom/Icon",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <ledger-icon-atom .type=${args.type} .size=${args.size} />
    </div>`,
  argTypes: {
    type: {
      control: "select",
      options: ["ledger", "close", "bluetooth", "usb", "chevron"],
      description: "The type of icon to display",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "The size of the icon",
    },
  },
};

export default meta;
type Story = StoryObj;

export const LedgerIconSmall: Story = {
  args: {
    type: "ledger",
    size: "small",
  },
};

export const LedgerIconMedium: Story = {
  args: {
    type: "ledger",
    size: "medium",
  },
};

export const LedgerIconLarge: Story = {
  args: {
    type: "ledger",
    size: "large",
  },
};

export const CloseIconSmall: Story = {
  args: {
    type: "close",
    size: "small",
  },
};

export const CloseIconMedium: Story = {
  args: {
    type: "close",
    size: "medium",
  },
};

export const CloseIconLarge: Story = {
  args: {
    type: "close",
    size: "large",
  },
};

export const BluetoothIconSmall: Story = {
  args: {
    type: "bluetooth",
    size: "small",
  },
};

export const BluetoothIconMedium: Story = {
  args: {
    type: "bluetooth",
    size: "medium",
  },
};

export const BluetoothIconLarge: Story = {
  args: {
    type: "bluetooth",
    size: "large",
  },
};

export const UsbIconSmall: Story = {
  args: {
    type: "usb",
    size: "small",
  },
};

export const UsbIconMedium: Story = {
  args: {
    type: "usb",
    size: "medium",
  },
};

export const UsbIconLarge: Story = {
  args: {
    type: "usb",
    size: "large",
  },
};

export const ChevronIconSmall: Story = {
  args: {
    type: "chevron",
    size: "small",
  },
};

export const ChevronIconMedium: Story = {
  args: {
    type: "chevron",
    size: "medium",
  },
};

export const ChevronIconLarge: Story = {
  args: {
    type: "chevron",
    size: "large",
  },
};

export const AllIcons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;"
    >
      <div style="text-align: center;">
        <ledger-icon-atom type="ledger" size="medium"></ledger-icon-atom>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Ledger</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon-atom type="close" size="medium"></ledger-icon-atom>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Close</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon-atom type="bluetooth" size="medium"></ledger-icon-atom>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Bluetooth</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon-atom type="usb" size="medium"></ledger-icon-atom>
        <p style="margin: 8px 0 0 0; font-size: 12px;">USB</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon-atom type="chevron" size="medium"></ledger-icon-atom>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Chevron</p>
      </div>
    </div>
  `,
};

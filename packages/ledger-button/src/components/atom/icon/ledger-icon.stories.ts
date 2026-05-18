import "./ledger-icon";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Atom/Icon",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <ledger-icon .type=${args.type} .size=${args.size}></ledger-icon>
    </div>`,
  argTypes: {
    type: {
      control: "select",
      options: [
        "ledger",
        "back",
        "close",
        "bluetooth",
        "usb",
        "chevronRight",
        "chevronDown",
        "check",
        "checkMarkCircleFill",
        "error",
        "device",
        "mobile",
        "desktop",
      ],
      description: "The type of icon to display",
    },
    size: {
      control: "select",
      options: [12, 16, 20, 24, 32, 40, 48, 56],
      description: "The size of the icon (Lumen IconSize)",
    },
    fillColor: {
      control: "color",
      description: "The color of the icon",
      options: ["white", "black"],
    },
  },
};

export default meta;
type Story = StoryObj;

export const LedgerIconSmall: Story = {
  args: {
    type: "ledger",
    size: 16,
  },
};

export const LedgerIconMedium: Story = {
  args: {
    type: "ledger",
    size: 24,
  },
};

export const LedgerIconLarge: Story = {
  args: {
    type: "ledger",
    size: 32,
  },
};

export const CloseIconSmall: Story = {
  args: {
    type: "close",
    size: 16,
  },
};

export const CloseIconMedium: Story = {
  args: {
    type: "close",
    size: 24,
  },
};

export const CloseIconLarge: Story = {
  args: {
    type: "close",
    size: 32,
  },
};

export const BluetoothIconSmall: Story = {
  args: {
    type: "bluetooth",
    size: 16,
  },
};

export const BluetoothIconMedium: Story = {
  args: {
    type: "bluetooth",
    size: 24,
  },
};

export const BluetoothIconLarge: Story = {
  args: {
    type: "bluetooth",
    size: 32,
  },
};

export const UsbIconSmall: Story = {
  args: {
    type: "usb",
    size: 16,
  },
};

export const UsbIconMedium: Story = {
  args: {
    type: "usb",
    size: 24,
  },
};

export const UsbIconLarge: Story = {
  args: {
    type: "usb",
    size: 32,
  },
};

export const ChevronRightIconSmall: Story = {
  args: {
    type: "chevronRight",
    size: 16,
  },
};

export const ChevronRightIconMedium: Story = {
  args: {
    type: "chevronRight",
    size: 24,
  },
};

export const ChevronRightIconLarge: Story = {
  args: {
    type: "chevronRight",
    size: 32,
  },
};

export const ChevronDownIconSmall: Story = {
  args: {
    type: "chevronDown",
    size: 16,
  },
};

export const ChevronDownIconMedium: Story = {
  args: {
    type: "chevronDown",
    size: 24,
  },
};

export const ChevronDownIconLarge: Story = {
  args: {
    type: "chevronDown",
    size: 32,
  },
};

export const BackIconSmall: Story = {
  args: {
    type: "back",
    size: 16,
  },
};

export const BackIconMedium: Story = {
  args: {
    type: "back",
    size: 24,
  },
};

export const CheckIconSmall: Story = {
  args: {
    type: "check",
    size: 16,
  },
};

export const CheckIconMedium: Story = {
  args: {
    type: "check",
    size: 24,
  },
};

export const CheckIconLarge: Story = {
  args: {
    type: "check",
    size: 32,
  },
};

export const ErrorIconSmall: Story = {
  args: {
    type: "error",
    size: 16,
  },
};

export const ErrorIconMedium: Story = {
  args: {
    type: "error",
    size: 24,
  },
};

export const ErrorIconLarge: Story = {
  args: {
    type: "error",
    size: 32,
  },
};

export const DeviceIconSmall: Story = {
  args: {
    type: "device",
    size: 16,
  },
};

export const DeviceIconMedium: Story = {
  args: {
    type: "device",
    size: 24,
  },
};

export const DeviceIconLarge: Story = {
  args: {
    type: "device",
    size: 32,
  },
};

export const MobileIconSmall: Story = {
  args: {
    type: "mobile",
    size: 16,
    fillColor: "white",
  },
};
export const MobileIconMedium: Story = {
  args: {
    type: "mobile",
    size: 24,
    fillColor: "black",
  },
};

export const MobileIconLarge: Story = {
  args: {
    type: "mobile",
    size: 32,
    fillColor: "white",
  },
};

export const AllIcons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;"
    >
      <div style="text-align: center;">
        <ledger-icon type="ledger" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Ledger</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="close" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Close</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="bluetooth" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Bluetooth</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="usb" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">USB</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="back" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Back</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="chevronRight" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Chevron Right</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="check" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Check</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="checkMarkCircleFill" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Check mark circle fill</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="error" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Error</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="device" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Device</p>
      </div>
      <div style="text-align: center;">
        <ledger-icon type="platform" .size=${24}></ledger-icon>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Platform</p>
      </div>
    </div>
  `,
};

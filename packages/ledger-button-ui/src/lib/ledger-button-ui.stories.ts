import "./ledger-button-ui";

import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

import type { LedgerButtonUIAttributes } from "./ledger-button-ui";

const meta: Meta<LedgerButtonUIAttributes> = {
  title: "Components/LedgerButtonUI",
  tags: ["autodocs"],
  render: (args) =>
    html`<ledger-button-ui
      .label=${args.label || "Connect Ledger"}
      ?disabled=${args.disabled}
      .variant=${args.variant || "primary"}
      .size=${args.size || "medium"}
      @ledger-button-click=${(e: CustomEvent) => {
        console.log("Button clicked:", e.detail);
      }}
    ></ledger-button-ui>`,
  argTypes: {
    label: {
      control: "text",
      description: "The text displayed on the button",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline"],
      description: "The variant of the button",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "The size of the button",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerButtonUIAttributes>;

export const Primary: Story = {
  args: {
    label: "Connect Ledger",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    label: "Connect Ledger",
    variant: "secondary",
    size: "medium",
    disabled: false,
  },
};

export const Outline: Story = {
  args: {
    label: "Connect Ledger",
    variant: "outline",
    size: "medium",
    disabled: false,
  },
};

export const Small: Story = {
  args: {
    label: "Connect Ledger",
    variant: "primary",
    size: "small",
    disabled: false,
  },
};

export const Large: Story = {
  args: {
    label: "Connect Ledger",
    variant: "primary",
    size: "large",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: "Connect Ledger",
    variant: "primary",
    size: "medium",
    disabled: true,
  },
};

export const CustomLabel: Story = {
  args: {
    label: "Connect Hardware Wallet",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
};

export const AllVariants: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;"
    >
      <ledger-button-ui
        label="Primary"
        variant="primary"
        size="medium"
      ></ledger-button-ui>
      <ledger-button-ui
        label="Secondary"
        variant="secondary"
        size="medium"
      ></ledger-button-ui>
      <ledger-button-ui
        label="Outline"
        variant="outline"
        size="medium"
      ></ledger-button-ui>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;"
    >
      <ledger-button-ui
        label="Small"
        variant="primary"
        size="small"
      ></ledger-button-ui>
      <ledger-button-ui
        label="Medium"
        variant="primary"
        size="medium"
      ></ledger-button-ui>
      <ledger-button-ui
        label="Large"
        variant="primary"
        size="large"
      ></ledger-button-ui>
    </div>
  `,
};

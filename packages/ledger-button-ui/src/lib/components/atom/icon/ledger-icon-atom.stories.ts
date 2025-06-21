import "./ledger-icon-atom";

import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

import type { LedgerIconAtomAttributes } from "./ledger-icon-atom";

const meta: Meta<LedgerIconAtomAttributes> = {
  title: "Component/Atom/Icon",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <ledger-icon-atom .type=${args.type} .size=${args.size} />
    </div>`,
  argTypes: {
    type: {
      control: "select",
      options: ["ledger", "close"],
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
type Story = StoryObj<LedgerIconAtomAttributes>;

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

import "./ledger-toast";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import en from "../../../i18n/en.json" with { type: "json" };
import type { LedgerToastAttributes } from "./ledger-toast";

const errorCopy = en.signTransaction.error;

const meta: Meta<LedgerToastAttributes> = {
  title: "Component/Atom/Toast",
  component: "ledger-toast",
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["success", "fail"],
      description: "Visual state of the toast",
      table: {
        type: { summary: "success | fail" },
        defaultValue: { summary: "success" },
      },
    },
    title: {
      control: { type: "text" },
      description: "Toast title",
      table: { type: { summary: "string" } },
    },
    description: {
      control: { type: "text" },
      description: "Optional description shown below the title",
      table: { type: { summary: "string" } },
    },
    linkText: {
      control: { type: "text" },
      description: "Optional link label (requires linkHref)",
      table: { type: { summary: "string" } },
    },
    linkHref: {
      control: { type: "text" },
      description: "Optional link target (requires linkText)",
      table: { type: { summary: "string" } },
    },
    duration: {
      control: { type: "number" },
      description: "Hold time (ms) before fade-out when autoDismiss is true",
      table: { type: { summary: "number" }, defaultValue: { summary: "1000" } },
    },
    autoDismiss: {
      control: { type: "boolean" },
      description: "Automatically fade out after `duration` ms",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    dismissible: {
      control: { type: "boolean" },
      description: "Show the close button",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
  decorators: [
    (story) => html`
      <div style="width: 352px; max-width: 100%;">${story()}</div>
    `,
  ],
};

export default meta;
type Story = StoryObj<LedgerToastAttributes>;

export const Success: Story = {
  args: {
    variant: "success",
    title: "Transaction confirmed",
    description: "0.2873 ETH \u2192 293.39 USDC",
    autoDismiss: false,
    dismissible: true,
  },
};

export const Fail: Story = {
  args: {
    variant: "fail",
    title: errorCopy.title,
    linkText: "Check transaction on explorer",
    linkHref: "https://etherscan.io",
    autoDismiss: false,
    dismissible: true,
  },
};

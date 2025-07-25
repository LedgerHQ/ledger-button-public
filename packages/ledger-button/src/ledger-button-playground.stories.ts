import "./ledger-button-playground";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Demo/LedgerButtonPlayground",
  render: (args) => html`
    <ledger-button-playground
      .demoMode=${args.demoMode}
      .transactionData=${args.transactionData}
    ></ledger-button-playground>
  `,
  argTypes: {
    demoMode: {
      control: { type: "select" },
      options: ["onboarding", "signTransaction"],
      description: "Choose the demo flow to show",
    },
    transactionData: {
      control: { type: "object" },
      description:
        "Transaction data for sign transaction demo (shows full flow with device selection)",
    },
  },
};

export default meta;
type Story = StoryObj;

export const Onboarding: Story = {
  args: {
    demoMode: "onboarding",
  },
};

export const SignTransaction: Story = {
  args: {
    demoMode: "signTransaction",
    transactionData: {},
  },
};

import "./ledger-button-playground";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Demo/LedgerButtonPlayground",
  // Factories are supplied by the host in real apps; the playground story runs
  // without family packages so the UI package stays free of -evm/-solana deps.
  render: () => html` <ledger-button-playground></ledger-button-playground> `,
};

export default meta;
type Story = StoryObj;

export const Onboarding: Story = {};

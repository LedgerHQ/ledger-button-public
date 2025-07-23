import "./ledger-button-ui";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Molecule/LedgerButtonUI",
  tags: ["autodocs"],
  render: () => html`<ledger-button-ui></ledger-button-ui>`,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const InContext: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 20px; padding: 20px;"
    >
      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Ledger Button UI Molecule
        </h3>
        <ledger-button-ui></ledger-button-ui>
      </div>
    </div>
  `,
};

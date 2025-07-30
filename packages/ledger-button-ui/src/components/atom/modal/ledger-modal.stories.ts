import "../button/ledger-button";
import "./ledger-modal";
import "../../molecule/toolbar/ledger-toolbar";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerModal } from "./ledger-modal";

const meta: Meta<LedgerModal> = {
  title: "Component/Atom/Modal",
  component: "ledger-modal",
  tags: ["autodocs"],
  render: () => html`
    <ledger-button
      @click=${() => {
        const modal = document.querySelector("ledger-modal");
        if (modal) {
          modal.openModal();
        }
      }}
      label="Open Modal"
      variant="secondary"
    >
    </ledger-button>
    <ledger-modal>
      <div slot="toolbar">
        <ledger-toolbar
          title="Modal V2"
          @ledger-toolbar-close=${() => {
            const modal = document.querySelector("ledger-modal");
            if (modal) {
              modal.closeModal();
            }
          }}
        ></ledger-toolbar>
      </div>
      <div>hello</div>
    </ledger-modal>
  `,
};

export default meta;
type Story = StoryObj<LedgerModal>;

export const Default: Story = {
  args: {},
};

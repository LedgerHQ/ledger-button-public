import "../../atom/button/ledger-button";
import "./ledger-transaction-notifications";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerTransactionNotifications } from "./ledger-transaction-notifications";

const meta: Meta = {
  title: "Component/Molecule/TransactionNotifications",
  component: "ledger-transaction-notifications",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Higher-level wrapper that holds a list of transaction toasts. Use `push`, `dismiss`, and `clear` to drive it.",
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (story) => html`
      <div
        style="min-height: 50vh; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px;"
      >
        ${story()}
      </div>
    `,
  ],
};

export default meta;
type Story = StoryObj;

const getNotifications = () =>
  document.querySelector("#tn-many") as LedgerTransactionNotifications | null;

export const Default: Story = {
  render: () => {
    const pushSuccess = () => {
      getNotifications()?.push({
        variant: "success",
        title: "Transaction confirmed",
        description: "0.2873 ETH \u2192 293.39 USDC",
      });
    };

    const pushFail = () => {
      getNotifications()?.push({
        variant: "fail",
        title: "Transaction failed",
        linkText: "Check transaction on explorer",
        linkHref: "https://etherscan.io",
      });
    };

    const pushBurst = () => {
      const tn = getNotifications();
      if (!tn) {
        return;
      }

      [pushSuccess, pushFail, pushSuccess].forEach((fn, index) => {
        setTimeout(fn, index * 350);
      });
    };

    const clearAll = () => {
      getNotifications()?.clear();
    };

    return html`
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <ledger-button
          label="Push success"
          variant="primary"
          @click=${pushSuccess}
        ></ledger-button>
        <ledger-button
          label="Push fail"
          variant="secondary"
          @click=${pushFail}
        ></ledger-button>
        <ledger-button
          label="Push 3 in a row"
          variant="secondary"
          @click=${pushBurst}
        ></ledger-button>
        <ledger-button
          label="Clear"
          variant="noBackground"
          @click=${clearAll}
        ></ledger-button>
      </div>
      <ledger-transaction-notifications
        id="tn-many"
      ></ledger-transaction-notifications>
    `;
  },
};

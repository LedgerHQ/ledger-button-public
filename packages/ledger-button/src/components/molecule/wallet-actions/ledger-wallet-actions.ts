import "../../atom/icon/ledger-icon.js";

import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";

export type WalletTransactionFeature =
  | "send"
  | "receive"
  | "swap"
  | "buy"
  | "earn"
  | "sell";

export type WalletActionClickEventDetail = {
  action: WalletTransactionFeature;
  timestamp: number;
};

export interface LedgerWalletActionsAttributes {
  features?: WalletTransactionFeature[];
}

@customElement("ledger-wallet-actions")
@tailwindElement()
export class LedgerWalletActions extends LitElement {
  @property({ type: Array })
  features: WalletTransactionFeature[] = [];

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private handleActionClick(action: WalletTransactionFeature) {
    this.dispatchEvent(
      new CustomEvent<WalletActionClickEventDetail>("wallet-action-click", {
        bubbles: true,
        composed: true,
        detail: {
          action,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private getActionLabel(action: WalletTransactionFeature): string {
    const translations = this.languages?.currentTranslation;
    const labels: Record<WalletTransactionFeature, string> = {
      send: translations?.walletActions?.send ?? "Send",
      receive: translations?.walletActions?.receive ?? "Receive",
      swap: translations?.walletActions?.swap ?? "Swap",
      buy: translations?.walletActions?.buy ?? "Buy",
      earn: translations?.walletActions?.earn ?? "Earn",
      sell: translations?.walletActions?.sell ?? "Sell",
    };
    return labels[action];
  }

  private renderActionButton(action: WalletTransactionFeature) {
    return html`
      <button
        class="flex h-[59px] shrink-0 grow basis-0 flex-col items-center justify-center gap-4 rounded-md bg-muted px-8 py-0 text-white transition duration-150 ease-in-out hover:bg-muted-hover active:bg-muted-pressed"
        @click=${() => this.handleActionClick(action)}
        aria-label=${this.getActionLabel(action)}
      >
        <div class="h-20 w-20 shrink-0">
          <ledger-icon fillColor="white" type=${action} size="20"></ledger-icon>
        </div>
        <span
          class="overflow-hidden text-ellipsis text-center body-3"
          >${this.getActionLabel(action)}</span
        >
      </button>
    `;
  }

  private renderRow(actions: WalletTransactionFeature[]) {
    return html`
      <div class="flex flex-row items-start gap-12">
        ${actions.map((action) => this.renderActionButton(action))}
      </div>
    `;
  }

  override render() {
    if (!this.features || this.features.length === 0) {
      return nothing;
    }

    // For 6 actions, split into 2 rows of 3
    if (this.features.length >= 6) {
      const firstRow = this.features.slice(0, 3);
      const secondRow = this.features.slice(3, 6);
      return html`
        <div class="flex flex-col gap-12">
          ${this.renderRow(firstRow)} ${this.renderRow(secondRow)}
        </div>
      `;
    }

    // For 2-5 actions, single row
    return this.renderRow(this.features);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-wallet-actions": LedgerWalletActions;
  }
}

export default LedgerWalletActions;

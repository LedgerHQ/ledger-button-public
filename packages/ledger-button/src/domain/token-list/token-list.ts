import "../../components/index.js";

import type {
  DetailedAccount,
  Token,
} from "@ledgerhq/ledger-wallet-provider-core";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../tailwind-element.js";
import {
  formatFiatBalance,
  formatTokenBalance,
} from "../../utils/format-fiat.js";

@customElement("token-list-screen")
@tailwindElement()
export class TokenListScreen extends LitElement {
  @property({ type: Object })
  account?: DetailedAccount;

  @property({ type: String })
  locale!: string;

  private renderNativeCoin() {
    if (!this.account) return "";

    return html`
      <ledger-chain-item
        ledger-id=${this.account.currencyId}
        .title=${this.account.ticker}
        .ticker=${this.account.ticker}
        .value=${formatTokenBalance(this.account.balance ?? "0", this.locale)}
        .fiatValue=${formatFiatBalance(this.account.fiatBalance, this.locale)}
        .isClickable=${false}
        type="network"
        iconVariant="rounded"
      ></ledger-chain-item>
    `;
  }

  private renderDivider() {
    return html`<div class="border-muted-subtle h-1 w-full border-t"></div>`;
  }

  private renderTokenItem = (token: Token) => {
    return html`
      <ledger-chain-item
        ledger-id=${token.ledgerId}
        .title=${token.name}
        .subtitle=${token.ticker}
        .ticker=${token.ticker}
        .value=${formatTokenBalance(token.balance, this.locale)}
        .fiatValue=${formatFiatBalance(token.fiatBalance, this.locale)}
        .isClickable=${false}
        type="token"
        iconVariant="rounded"
      ></ledger-chain-item>
    `;
  };

  private renderTokenList() {
    if (!this.account || this.account.tokens.length === 0) {
      return "";
    }

    return html`
      <div class="flex flex-col">
        ${this.account.tokens.map(this.renderTokenItem)}
      </div>
    `;
  }

  override render() {
    if (!this.account) {
      return html`
        <div class="flex flex-col items-center justify-center py-32">
          <span class="text-muted body-2">Loading...</span>
        </div>
      `;
    }

    return html`
      <div class="flex flex-col gap-12">
        ${this.renderNativeCoin()} ${this.renderDivider()}
        ${this.renderTokenList()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "token-list-screen": TokenListScreen;
  }
}

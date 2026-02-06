import "../../components/index.js";

import type { Token } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { type CoreContext, coreContext } from "../../context/core-context.js";
import { tailwindElement } from "../../tailwind-element.js";
import { TokenListController } from "./token-list-controller.js";

@customElement("token-list-screen")
@tailwindElement()
export class TokenListScreen extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  controller!: TokenListController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new TokenListController(this, this.coreContext);
  }

  private renderNativeCoin() {
    if (!this.controller?.account) return "";
    const account = this.controller.account;

    return html`
      <ledger-chain-item
        ledger-id=${account.currencyId}
        .title=${account.ticker}
        .ticker=${account.ticker}
        .value=${account.balance ?? "0"}
        .fiatValue=${this.controller.formatFiatValue(account.fiatBalance)}
        .isClickable=${false}
        type="network"
        iconVariant="rounded"
      ></ledger-chain-item>
    `;
  }

  private renderDivider() {
    return html`<div class="lb-h-1 lb-bg-muted-subtle"></div>`;
  }

  private renderTokenItem = (token: Token) => {
    return html`
      <ledger-chain-item
        ledger-id=${token.ticker}
        .title=${token.name}
        .subtitle=${token.ticker}
        .ticker=${token.ticker}
        .value=${token.balance}
        .fiatValue=${this.controller.formatFiatValue(token.fiatBalance)}
        .isClickable=${false}
        type="token"
        iconVariant="rounded"
      ></ledger-chain-item>
    `;
  };

  private renderTokenList() {
    if (
      !this.controller?.account ||
      this.controller.account.tokens.length === 0
    ) {
      return "";
    }

    return html`
      <div class="lb-flex lb-flex-col">
        ${this.controller.account.tokens.map(this.renderTokenItem)}
      </div>
    `;
  }

  override render() {
    if (!this.controller?.account) {
      return html`
        <div
          class="lb-flex lb-flex-col lb-items-center lb-justify-center lb-py-32"
        >
          <span class="lb-text-muted lb-body-2">Loading...</span>
        </div>
      `;
    }

    return html`
      <div class="lb-flex lb-flex-col lb-gap-12">
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

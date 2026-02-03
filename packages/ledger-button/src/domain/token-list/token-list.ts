import "../../components/index.js";

import type {
  DetailedAccount,
  FiatBalance,
  Token,
} from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { type CoreContext, coreContext } from "../../context/core-context.js";
import { tailwindElement } from "../../tailwind-element.js";

@customElement("token-list-screen")
@tailwindElement()
export class TokenListScreen extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @state()
  private account: DetailedAccount | undefined = undefined;

  override async connectedCallback() {
    super.connectedCallback();
    await this.getSelectedAccount();
  }

  private async getSelectedAccount() {
    const result = await this.coreContext.getDetailedSelectedAccount();
    if (result.isRight()) {
      this.account = result.extract();
    }
  }

  private formatFiatValue(
    fiatBalance: FiatBalance | undefined,
  ): string | undefined {
    if (!fiatBalance) return undefined;
    const symbol = fiatBalance.currency === "USD" ? "$" : fiatBalance.currency;
    return `${symbol}${fiatBalance.value}`;
  }

  private renderNativeCoin() {
    if (!this.account) return "";

    return html`
      <ledger-chain-item
        ledger-id=${this.account.currencyId}
        .title=${this.account.ticker}
        .ticker=${this.account.ticker}
        .value=${this.account.balance ?? "0"}
        .fiatValue=${this.formatFiatValue(this.account.fiatBalance)}
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
        .fiatValue=${this.formatFiatValue(token.fiatBalance)}
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
      <div class="lb-flex lb-flex-col">
        ${this.account.tokens.map(this.renderTokenItem)}
      </div>
    `;
  }

  override render() {
    if (!this.account) {
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

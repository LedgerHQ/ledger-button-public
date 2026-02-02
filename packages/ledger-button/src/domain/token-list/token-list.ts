import "../../components/index.js";

import type { Account, Token } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { type CoreContext, coreContext } from "../../context/core-context.js";
import { tailwindElement } from "../../tailwind-element.js";

type AccountWithFiat = Account & {
  fiatBalance?: { value: string; currency: string };
};

type TokenWithFiat = Token & {
  fiatValue?: string;
};

@customElement("token-list-screen")
@tailwindElement()
export class TokenListScreen extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @state()
  private account: AccountWithFiat | undefined = undefined;

  override async connectedCallback() {
    super.connectedCallback();
    await this.getSelectedAccount();
  }

  private async getSelectedAccount() {
    this.account =
      (await this.coreContext.getDetailedSelectedAccount()) as AccountWithFiat;
  }

  private formatFiatValue(
    fiatBalance: { value: string; currency: string } | undefined,
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
      ></ledger-chain-item>
    `;
  }

  private renderDivider() {
    return html`<div class="lb-h-1 lb-bg-muted-subtle"></div>`;
  }

  private renderTokenItem = (token: TokenWithFiat) => {
    return html`
      <ledger-chain-item
        ledger-id=${token.ticker}
        .title=${token.name}
        .subtitle=${token.ticker}
        .ticker=${token.ticker}
        .value=${token.balance}
        .fiatValue=${"$0.00"}
        .isClickable=${false}
        type="token"
      ></ledger-chain-item>
    `;
  };

  private renderTokenList() {
    if (!this.account || this.account.tokens.length === 0) {
      return "";
    }

    return html`
      <div class="lb-flex lb-flex-col">
        ${(this.account.tokens as TokenWithFiat[]).map(this.renderTokenItem)}
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

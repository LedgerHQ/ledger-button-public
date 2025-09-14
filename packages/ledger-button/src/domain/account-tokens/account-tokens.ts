import "../../components/index.js";

import { Account, Token } from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { tailwindElement } from "../../tailwind-element.js";

@customElement("account-tokens-screen")
@tailwindElement()
export class AccountTokensScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: String })
  accountAddress?: string;

  private get account(): Account | null {
    const targetAddress = this.accountAddress || this.coreContext.getPendingAccountAddress();
    if (!targetAddress) {
      const accounts = this.coreContext.getAccounts();
      return accounts.length > 0 ? accounts[0] : null;
    }
    return this.coreContext.getAccounts().find(
      acc => acc.freshAddress === targetAddress
    ) || null;
  }

  override connectedCallback() {
    super.connectedCallback();
    const pendingAddress = this.coreContext.getPendingAccountAddress();
    if (pendingAddress) {
      this.accountAddress = pendingAddress;
      this.coreContext.clearPendingAccountAddress();
    }
  }

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private formatAddress(address: string): string {
    if (!address || address.length <= 8) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private renderTokenItem = (token: Token) => {
    return html`
      <ledger-chain-item
        ledger-id=${token.address}
        .title=${token.name}
        .subtitle=${token.symbol}
        .ticker=${token.symbol}
        .value=${token.balance}
        .isClickable=${false}
        type="token"
      ></ledger-chain-item>
    `;
  };

  private renderConnectButton() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="fixed bottom-24 left-24 right-24">
        <ledger-button
          variant="primary"
          size="large"
          .label=${translations.common.connect}
          @ledger-button-click=${this.handleConnect}
        ></ledger-button>
      </div>
    `;
  }

  private handleConnect() {
    if (this.account) {
      this.dispatchEvent(
        new CustomEvent<Account>("ledger-internal-account-selected", {
          bubbles: true,
          composed: true,
          detail: this.account,
        }),
      );
    }
  }

  override render() {
    const translations = this.languages.currentTranslation;

    if (!this.account) {
      return html`
        <div class="flex h-full items-center justify-center">
          <span class="text-muted body-2">Account not found</span>
        </div>
      `;
    }

    return html`
      <div class="flex h-full flex-col">
        <div class="flex flex-col gap-4 p-24 pt-12 border-b border-muted-subtle">
          <div class="flex items-center gap-12">
            <ledger-crypto-icon
              ledger-id=${this.account.currencyId}
              variant="square"
              size="large"
            ></ledger-crypto-icon>
            <div class="flex flex-col gap-4">
              <span class="text-lg body-1-semi-bold">${this.account.name}</span>
              <span class="text-muted body-3">${this.formatAddress(this.account.freshAddress)}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-24 pb-96">
          <div class="flex flex-col gap-12">
            ${this.account.tokens.length > 0
              ? this.account.tokens.map(this.renderTokenItem)
              : html`
                  <div class="flex flex-col items-center justify-center py-48 text-center">
                    <span class="text-muted body-2">
                      ${translations.accountTokens?.noTokens || "No tokens found for this account"}
                    </span>
                  </div>
                `
            }
          </div>
        </div>

        ${this.renderConnectButton()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "account-tokens-screen": AccountTokensScreen;
  }
}

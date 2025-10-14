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
import { AccountTokenController } from "./account-token-controller.js";

@customElement("account-tokens-screen")
@tailwindElement()
export class AccountTokensScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  controller!: AccountTokenController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new AccountTokenController(
      this,
      this.coreContext,
      this.navigation,
    );
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
        ledger-id=${token.ticker}
        .title=${token.name}
        .subtitle=${token.ticker}
        .ticker=${token.ticker}
        .value=${token.balance}
        .isClickable=${false}
        type="token"
      ></ledger-chain-item>
    `;
  };

  private renderConnectButton() {
    const translations = this.languages.currentTranslation;

    return html`
      <div
        class="bottom-24 left-24 right-24"
        style="position: sticky; bottom: 0; z-index: 100; background-color: black; padding: 12px;"
      >
        <ledger-button
          variant="secondary"
          size="full"
          .label=${translations.common.connect}
          @ledger-button-click=${this.controller.handleConnect}
        ></ledger-button>
      </div>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;

    if (!this.controller.account) {
      return html`
        <div class="flex h-full items-center justify-center">
          <span class="text-muted body-2">Account not found</span>
        </div>
      `;
    }

    return html`
      <div class="flex h-full flex-col" style="position: relative;">
        <div
          class="flex flex-col gap-4 border-b border-muted-subtle p-24 pt-12"
          style="position: sticky; top: 0; z-index: 100; background-color: black;"
        >
          <div class="flex items-center gap-12">
            <ledger-crypto-icon
              ledger-id=${this.controller.account.currencyId}
              variant="square"
              size="large"
            ></ledger-crypto-icon>
            <div class="flex flex-col gap-4">
              <span class="text-lg body-1-semi-bold"
                >${this.controller.account.name}</span
              >
              <span class="text-muted body-3"
                >${this.formatAddress(
                  this.controller.account.freshAddress,
                )}</span
              >
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-24 pb-96">
          <div class="flex flex-col gap-12">
            ${this.controller.account.tokens.length > 0
              ? this.controller.account.tokens.map(this.renderTokenItem)
              : html`
                  <div
                    class="flex flex-col items-center justify-center py-48 text-center"
                  >
                    <span class="text-muted body-2">
                      ${translations.accountTokens?.noTokens ||
                      "No tokens found for this account"}
                    </span>
                  </div>
                `}
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
  interface WindowEventMap {
    "ledger-internal-account-selected": CustomEvent<
      | {
          account: Account;
          status: "success";
        }
      | {
          status: "error";
          error: unknown;
        }
    >;
  }
}

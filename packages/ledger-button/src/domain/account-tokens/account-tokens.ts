import "../../components/index.js";

import { Account, AccountWithFiat, Token } from "@ledgerhq/ledger-wallet-provider-core";
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
import { getDisplayTokens } from "../../utils/account-display-tokens.js";
import { formatFiatBalance } from "../../utils/format-fiat.js";
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

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private renderTokenItem = (token: Token) => {
    return html`
      <ledger-chain-item
        ledger-id=${token.ticker}
        .title=${token.name}
        .subtitle=${token.ticker}
        .ticker=${token.ticker}
        .value=${token.balance}
        .fiatValue=${formatFiatBalance(
          token.fiatBalance,
          this.languages.locale,
        )}
        .isClickable=${false}
        type="token"
        iconVariant="rounded"
      ></ledger-chain-item>
    `;
  };

  private renderLoadingSkeleton() {
    return html`
      <div class="flex flex-col gap-12">
        <ledger-skeleton class="h-48 w-full rounded-xl"></ledger-skeleton>
      </div>
    `;
  }

  private renderEmptyState() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="flex flex-col items-center justify-center py-48 text-center">
        <span class="text-muted body-2">
          ${translations.accountTokens?.noTokens ||
          "No tokens found for this account"}
        </span>
      </div>
    `;
  }

  private renderTokenList(account: AccountWithFiat) {
    if (this.controller.loading) {
      return this.renderLoadingSkeleton();
    }

    const displayTokens = getDisplayTokens(account);

    if (displayTokens.length > 0) {
      return displayTokens.map(this.renderTokenItem);
    }

    return this.renderEmptyState();
  }

  private renderConnectButton() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="bg-canvas-sheet sticky bottom-0 p-24 pt-0">
        <ledger-button
          variant="primary"
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
          <span class="text-muted body-2"
            >${translations.accountTokens?.notFound}</span
          >
        </div>
      `;
    }

    return html`
      <div class="relative flex h-full flex-col">
        <div class="h-full overflow-y-auto p-24">
          <div class="flex flex-col gap-12">
            ${this.renderTokenList(this.controller.account)}
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

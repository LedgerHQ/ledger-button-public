import "../../../components/index.js";

import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { SelectAccountController } from "./select-account-controller.js";

@customElement("select-account-screen")
@tailwindElement()
export class SelectAccountScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: SelectAccountController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectAccountController(
      this,
      this.coreContext,
      this.navigation,
    );
  }

  renderAccountItem = (account: Account) => {
    const translations = this.languages.currentTranslation;
    const isBalanceLoading = this.controller.isAccountBalanceLoading(
      account.id,
    );
    const isBalanceError = this.controller.hasAccountBalanceError(account.id);

    // NOTE: The label should be displayed only if the account has tokens
    return html`
      <ledger-account-item
        .title=${account.name}
        .address=${account.freshAddress}
        .linkLabel=${translations.onboarding.selectAccount.showTokens}
        .ledgerId=${account.id}
        .ticker=${account.ticker}
        .balance=${account.balance ?? "0"}
        .tokens=${account.tokens.length}
        .currencyId=${account.currencyId}
        .isBalanceLoading=${isBalanceLoading}
        .isBalanceError=${isBalanceError}
        @account-item-click=${this.controller.handleAccountItemClick}
        @account-item-show-tokens-click=${this.controller
          .handleAccountItemShowTokensClick}
      ></ledger-account-item>
    `;
  };

  private renderBalanceLoadingFooter() {
    const translations = this.languages.currentTranslation;

    if (!this.controller.isBalanceLoading) {
      return "";
    }

    return html`
      <p class="lb-text-center lb-text-muted lb-body-3">
        ${translations.onboarding.selectAccount.refreshingAccounts}
        <br />
        ${translations.onboarding.selectAccount.refreshingAccountsHint}
      </p>
    `;
  }

  override render() {
    return html`
      <div class="lb-flex lb-flex-col lb-gap-12 lb-p-24 lb-pt-0">
        ${this.controller.accounts.map(this.renderAccountItem)}
      </div>
      ${this.renderBalanceLoadingFooter()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-account-screen": SelectAccountScreen;
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

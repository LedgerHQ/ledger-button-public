import "../../../components/index.js";

import { Account } from "@ledgerhq/ledger-button-core";
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

    // NOTE: The label should be displayed only if the account has tokens
    return html`
      <ledger-account-item
        .title=${account.name}
        .address=${account.freshAddress}
        .linkLabel=${translations.onboarding.selectAccount.showTokens}
        .ledgerId=${account.currencyId}
        .ticker=${account.ticker}
        .balance=${account.balance ?? "0"}
        .tokens=${account.tokens.length}
        @account-item-click=${this.controller.handleAccountItemClick}
        @account-item-show-tokens-click=${this.controller
          .handleAccountItemShowTokensClick}
      ></ledger-account-item>
    `;
  };

  override render() {
    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        ${this.controller.accounts.map(this.renderAccountItem)}
      </div>
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

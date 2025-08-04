import "@ledgerhq/ledger-button-ui";

import { Account } from "@ledgerhq/ledger-button-core";
import {
  AccountItemClickEventDetail,
  tailwindElement,
} from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
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

  // NOTE: Demo purpose only
  @property({ type: Boolean })
  shouldRefreshAccounts = false;

  controller!: SelectAccountController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectAccountController(
      this,
      this.coreContext,
      this.navigation,
      this.shouldRefreshAccounts,
    );
  }

  private handleAccountItemClick(
    event: CustomEvent<AccountItemClickEventDetail>,
  ) {
    this.controller.selectAccount(event.detail.address);
    this.dispatchEvent(
      new CustomEvent<AccountItemClickEventDetail>("account-selected", {
        bubbles: true,
        composed: true,
        detail: event.detail,
      }),
    );
  }

  private handleAccountItemShowTokensClick = (event: CustomEvent<Account>) => {
    console.log("account-item-show-tokens-click", event);
  };

  // TODO: Replace this monstrosity with a proper mapping
  private getTicker(currencyId: string) {
    switch (currencyId) {
      case "ethereum":
        return "ETH";
      case "bitcoin":
        return "BTC";
      default:
        return "";
    }
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
        .ticker=${this.getTicker(account.currencyId)}
        @account-item-click=${this.handleAccountItemClick}
        @account-item-show-tokens-click=${this.handleAccountItemShowTokensClick}
      ></ledger-account-item>
    `;
  };

  override render() {
    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        ${repeat(
          this.controller.accounts,
          (account) => account.freshAddress,
          this.renderAccountItem,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-account-screen": SelectAccountScreen;
  }

  interface HTMLElementEventMap {
    "account-selected": CustomEvent<AccountItemClickEventDetail>;
  }
}

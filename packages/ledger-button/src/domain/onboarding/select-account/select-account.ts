import "../../../components/index.js";

import { Account } from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { StatusType } from "../../../components/index.js";
import type { AccountItemClickEventDetail } from "../../../components/molecule/account-item/ledger-account-item.js";
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

  private handleAccountItemClick(
    event: CustomEvent<AccountItemClickEventDetail>,
  ) {
    this.controller.selectAccount(event.detail.address);
    const selectedAccount = this.coreContext.getSelectedAccount();
    this.dispatchEvent(
      new CustomEvent<Account>("ledger-internal-account-selected", {
        bubbles: true,
        composed: true,
        detail: selectedAccount,
      }),
    );
  }

  private handleAccountItemShowTokensClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    const account = this.coreContext
      .getAccounts()
      .find((acc) => acc.freshAddress === event.detail.address);

    if (account) {
      this.coreContext.setPendingAccountAddress(account.freshAddress);

      this.navigation.navigateTo({
        name: "accountTokens",
        component: "account-tokens-screen",
        canGoBack: true,
        toolbar: {
          title: `${account.name}`,
          showCloseButton: true,
        },
      });
    }
  };

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
        @account-item-click=${this.handleAccountItemClick}
        @account-item-show-tokens-click=${this.handleAccountItemShowTokensClick}
      ></ledger-account-item>
    `;
  };

  renderErrorScreen() {
    if (!this.controller.errorData) {
      return html``;
    }

    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        <ledger-status
          type="error"
          title=${this.controller.errorData.title}
          description=${this.controller.errorData.message}
          primary-button-label=${this.controller.errorData.cta1?.label ?? ""}
          secondary-button-label=${this.controller.errorData.cta2?.label ?? ""}
          @status-action=${this.handleStatusActionError}
        ></ledger-status>
      </div>
    `;
  }

  private async handleStatusActionError(
    e: CustomEvent<{
      timestamp: number;
      action: "primary" | "secondary";
      type: StatusType;
    }>,
  ) {
    if (e.detail.action === "primary") {
      await this.controller.errorData?.cta1?.action();
    } else if (e.detail.action === "secondary") {
      await this.controller.errorData?.cta2?.action();
    }
  }

  renderNormalScreen() {
    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        ${this.controller.accounts.map(this.renderAccountItem)}
      </div>
    `;
  }

  override render() {
    if (this.controller.errorData) {
      return this.renderErrorScreen();
    }

    return this.renderNormalScreen();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-account-screen": SelectAccountScreen;
  }

  interface WindowEventMap {
    "ledger-internal-account-selected": CustomEvent<Account>;
  }
}

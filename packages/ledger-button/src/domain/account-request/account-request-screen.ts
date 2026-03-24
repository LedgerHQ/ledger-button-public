import "../../components/index.js";

import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { AccountRequestController } from "./account-request-controller.js";

@customElement("account-request-screen")
@tailwindElement()
export class AccountRequestScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: AccountRequestController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new AccountRequestController(this, this.coreContext);
  }

  private renderAccountItem(account: AccountWithFiat) {
    return html`
      <ledger-account-item
        .title=${account.name}
        .address=${account.freshAddress}
        .ledgerId=${account.id}
        .ticker=${account.ticker}
        .balance=${account.balance ?? "0"}
        .tokens=${0}
        .currencyId=${account.currencyId}
        .isBalanceLoading=${this.controller.isAccountBalanceLoading(account.id)}
        .isBalanceError=${this.controller.hasAccountBalanceError(account.id)}
        .fiatBalance=${this.controller.getAccountFiatValue(account.id)}
        .isFiatLoading=${this.controller.isAccountFiatLoading(account.id)}
        .isFiatError=${this.controller.hasAccountFiatError(account.id)}
      ></ledger-account-item>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const accountRequest = translations.accountRequest;

    if (!accountRequest) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <div class="flex min-h-0 flex-col gap-24 p-24 pt-8">
        <p class="text-muted body-2">${accountRequest.description}</p>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="flex flex-col gap-8">
            ${this.controller.sortedAccounts.map((account) =>
              this.renderAccountItem(account),
            )}
          </div>
        </div>

        <div class="grid gap-12" style="grid-template-columns: 1fr 1fr;">
          <ledger-button
            variant="secondary"
            size="full"
            .label=${accountRequest.rejectButton}
            @click=${() => this.controller.handleReject()}
          ></ledger-button>

          <ledger-button
            variant="primary"
            size="full"
            .label=${accountRequest.allowButton}
            @click=${() => this.controller.handleAllow()}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "account-request-screen": AccountRequestScreen;
  }
}

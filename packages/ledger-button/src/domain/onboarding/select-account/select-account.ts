import "../../../components/index.js";

import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
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

  @consume({ context: langContext, subscribe: true })
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
    const isFiatLoading = this.controller.isAccountFiatLoading(account.id);
    const isFiatError = this.controller.hasAccountFiatError(account.id);
    const fiatBalance = this.controller.getAccountFiatValue(account.id);

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
        .fiatBalance=${fiatBalance}
        .isFiatLoading=${isFiatLoading}
        .isFiatError=${isFiatError}
        .locale=${this.languages.locale}
        @account-item-click=${(e: CustomEvent) =>
          this.controller.handleAccountItemClick(e)}
        @account-item-show-tokens-click=${(e: CustomEvent) =>
          this.controller.handleAccountItemShowTokensClick(e)}
      ></ledger-account-item>
    `;
  };

  private renderBalanceLoadingFooter() {
    const translations = this.languages.currentTranslation;

    if (!this.controller.isBalanceLoading) {
      return "";
    }

    return html`
      <div class="bg-canvas-sheet sticky bottom-0 pt-8 pb-16">
        <p class="text-muted body-3 text-center">
          ${translations.onboarding.selectAccount.refreshingAccounts}
          <br />
          ${translations.onboarding.selectAccount.refreshingAccountsHint}
        </p>
      </div>
    `;
  }

  private renderNoResults() {
    const translations = this.languages.currentTranslation;

    if (
      this.controller.filteredAccounts.length > 0 ||
      !this.controller.searchQuery
    ) {
      return nothing;
    }

    return html`
      <p class="text-muted body-2 py-24 text-center">
        ${translations.onboarding.selectAccount.noResults}
      </p>
    `;
  }

  private renderActionIconButton(params: {
    iconType: "plus" | "refresh";
    ariaLabel: string;
    tooltip: string;
    onClick: () => void;
  }) {
    return html`
      <ledger-tooltip .content=${params.tooltip} side="top" .sideOffset=${8}>
        <button
          type="button"
          class="bg-muted hover:bg-muted-hover active:bg-muted-pressed flex h-48 w-48 shrink-0 cursor-pointer items-center justify-center rounded-full border-none text-base"
          aria-label=${params.ariaLabel}
          @click=${params.onClick}
        >
          <ledger-icon
            .type=${params.iconType}
            size="small"
            fillColor="currentColor"
          ></ledger-icon>
        </button>
      </ledger-tooltip>
    `;
  }

  private renderSearchHeader() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="flex items-center gap-8">
        <ledger-search-input
          class="min-w-0 flex-1"
          .placeholder=${translations.onboarding.selectAccount
            .searchPlaceholder}
          .value=${this.controller.searchQuery}
          @search-input-change=${(e: CustomEvent) =>
            this.controller.handleSearchInput(e)}
          @search-input-clear=${() => this.controller.handleSearchClear()}
        ></ledger-search-input>
        ${this.renderActionIconButton({
          iconType: "plus",
          ariaLabel: translations.onboarding.selectAccount.addAccountAriaLabel,
          tooltip: translations.onboarding.selectAccount.addAccountTooltip,
          onClick: () => this.controller.handleAddAccountClick(),
        })}
        ${this.renderActionIconButton({
          iconType: "refresh",
          ariaLabel:
            translations.onboarding.selectAccount.refreshAccountsAriaLabel,
          tooltip: translations.onboarding.selectAccount.refreshAccountsTooltip,
          onClick: () => this.controller.handleRefreshAccountsClick(),
        })}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        ${this.renderSearchHeader()}
        ${this.controller.filteredAccounts.map(this.renderAccountItem)}
        ${this.renderNoResults()}
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

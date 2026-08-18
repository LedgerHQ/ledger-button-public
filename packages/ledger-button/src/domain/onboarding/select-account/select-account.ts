import "../../../components/index";

import {
  Account,
  type AccountGroup,
  type AccountListItem,
  type BlockchainFamily,
  type FiatBalance,
} from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { type SelectAccountNavigationParams } from "../../../shared/root-navigation-controller";
import { tailwindElement } from "../../../tailwind-element";
import { formatFiatBalance } from "../../../utils/format-fiat";
import { SelectAccountController } from "./select-account-controller";

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

  @property({ attribute: false })
  params?: SelectAccountNavigationParams;

  controller!: SelectAccountController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectAccountController(
      this,
      this.coreContext,
      this.navigation,
      this.languages,
      this.resolveRequestedFamily(),
    );
  }

  // Nested access stays optional: params may be absent on generic entry points.
  private resolveRequestedFamily(): BlockchainFamily | undefined {
    return this.params?.params?.family;
  }

  private renderAccountCard(account: AccountListItem) {
    const isBalanceLoading = this.controller.isAccountBalanceLoading(account);
    const isBalanceError = this.controller.hasAccountBalanceError(account);
    const isFiatLoading = this.controller.isAccountFiatLoading(account);
    const isFiatError = this.controller.hasAccountFiatError(account);

    return html`
      <div
        class="flex w-full cursor-pointer items-center gap-12 overflow-hidden rounded-md [background-color:var(--color-background-surface-transparent)] p-12 text-left transition duration-150 ease-in-out hover:[background-color:var(--color-background-surface-transparent-hover)] active:[background-color:var(--color-background-surface-transparent-pressed)]"
        role="button"
        tabindex="0"
        aria-label=${account.name}
        @click=${() => this.controller.handleAccountCardClick(account)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.controller.handleAccountCardClick(account);
          }
        }}
      >
        <ledger-crypto-icon
          ledger-id=${account.currencyId}
          variant="square"
          size="large"
        ></ledger-crypto-icon>
        <div class="flex min-w-0 flex-1 flex-col gap-4 text-left">
          <span class="body-2-semi-bold truncate text-base"
            >${account.name}</span
          >
          ${this.renderAccountCardTokenInfo(account, isBalanceLoading)}
        </div>
        <div class="flex shrink-0 flex-col items-end gap-4">
          ${this.renderAccountCardBalance({
            isBalanceLoading,
            isBalanceError,
            isFiatLoading,
            isFiatError,
            fiatBalance: account.totalFiatValue,
          })}
        </div>
      </div>
    `;
  }

  private renderAccountCardTokenInfo(
    account: AccountListItem,
    isBalanceLoading: boolean,
  ) {
    if (isBalanceLoading) {
      return html`<ledger-skeleton
        class="h-12 w-80 rounded-full"
      ></ledger-skeleton>`;
    }

    const displayTokens = account.displayTokens;

    if (displayTokens.length > 0) {
      return html`<button
        type="button"
        class="text-muted body-3 w-fit cursor-pointer border-none bg-transparent p-0 no-underline hover:underline"
        @click=${(e: Event) => {
          e.stopPropagation();
          this.controller.handleShowTokensClick(account);
        }}
      >
        ${this.controller.formatTokenCount(displayTokens.length)}
      </button>`;
    }

    const translations = this.languages.currentTranslation;

    return html`<span class="text-muted body-3"
      >${translations.onboarding.selectAccount.noToken}</span
    >`;
  }

  private renderAccountCardBalance(params: {
    isBalanceLoading: boolean;
    isBalanceError: boolean;
    isFiatLoading: boolean;
    isFiatError: boolean;
    fiatBalance: FiatBalance | undefined;
  }) {
    if (params.isBalanceLoading || params.isFiatLoading) {
      return html`<ledger-skeleton
        class="h-16 w-80 rounded-full"
      ></ledger-skeleton>`;
    }

    if (params.isBalanceError) {
      return html`<span class="body-2-semi-bold text-base">--</span>`;
    }

    const fiatValue = formatFiatBalance(
      params.fiatBalance,
      this.languages.locale,
    );

    if (params.isFiatError || !fiatValue) {
      return nothing;
    }

    return html`<span class="body-2-semi-bold text-base">${fiatValue}</span>`;
  }

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

  private renderGroup(group: AccountGroup) {
    return html`
      <div class="bg-muted-transparent flex flex-col gap-12 rounded-md p-12">
        <div class="flex flex-col py-4">
          <p class="body-1-semi-bold text-base">
            ${this.controller.truncateAddress(group.freshAddress)}
          </p>
          <p class="text-muted body-3">
            ${this.controller.formatGroupCount(group.accounts.length)}
          </p>
        </div>
        <div class="flex flex-col gap-12">
          ${group.accounts.map((account) => this.renderAccountCard(account))}
        </div>
      </div>
    `;
  }

  private renderNoResults() {
    const translations = this.languages.currentTranslation;

    if (this.controller.groups.length > 0 || !this.controller.searchQuery) {
      return nothing;
    }

    return html`
      <div class="flex min-h-px flex-1 flex-col items-center justify-center">
        <p class="body-1-semi-bold text-center text-base">
          ${translations.onboarding.selectAccount.noResults}
        </p>
      </div>
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
      <div class="flex h-full flex-col gap-12 p-24 pt-0">
        ${this.renderSearchHeader()}
        ${this.controller.groups.map((group) => this.renderGroup(group))}
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

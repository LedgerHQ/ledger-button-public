import "../../../shared/root-navigation";

import type {
  Account,
  AccountGroup,
  AccountListItem,
  BlockchainFamily,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs";

import { CoreContext } from "../../../context/core-context";
import { LanguageContext } from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { RootNavigationComponent } from "../../../shared/root-navigation";
import { type Destinations } from "../../../shared/routes";
import { formatAddress } from "../../../utils/format-address";

export type SelectAccountErrorData = {
  title: string;
  cta1?: { label: string; action: () => void };
  cta2?: { label: string; action: () => void };
};

export class SelectAccountController implements ReactiveController {
  groups: AccountGroup[] = [];
  hasLoadedGroups = false;
  errorData?: SelectAccountErrorData;
  private readonly searchQuery$ = new BehaviorSubject("");
  private groupsSubscription?: Subscription;

  get searchQuery(): string {
    return this.searchQuery$.value;
  }

  get showCompatibleAccountsError(): boolean {
    return this.errorData !== undefined && !this.searchQuery;
  }

  truncateAddress(address: string): string {
    return formatAddress(address);
  }

  formatGroupCount(count: number): string {
    const t = this.lang.currentTranslation.onboarding.selectAccount;
    return count === 1
      ? t.accountCountOne
      : t.accountCountOther.replace("{count}", String(count));
  }

  formatTokenCount(count: number): string {
    const t = this.lang.currentTranslation.onboarding.selectAccount;
    return count === 1
      ? t.tokenCountOne
      : t.tokenCountOther.replace("{count}", String(count));
  }

  get isBalanceLoading(): boolean {
    return this.groups.some((group) =>
      group.accounts.some(
        (account) => account.balanceLoadingState === "loading",
      ),
    );
  }

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly lang: LanguageContext,
    private readonly family?: BlockchainFamily,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccounts();
  }

  hostDisconnected() {
    if (this.groupsSubscription) {
      this.groupsSubscription.unsubscribe();
      this.groupsSubscription = undefined;
    }
  }

  getAccounts(options?: { forceRefresh?: boolean }) {
    if (this.groupsSubscription) {
      this.groupsSubscription.unsubscribe();
    }

    this.host.requestUpdate();

    this.groupsSubscription = this.core
      .observeAccountGroups({
        ...options,
        family: this.family,
        searchQuery$: this.searchQuery$,
      })
      .subscribe({
        next: (groups) => {
          this.groups = groups;
          this.hasLoadedGroups = true;
          this.syncCompatibleAccountsError();
          this.host.requestUpdate();
        },
        error: (error) => {
          console.error("Failed to fetch accounts", error);
          this.host.requestUpdate();
        },
        complete: () => {
          this.host.requestUpdate();
        },
      });
  }

  isAccountBalanceLoading(account: AccountListItem): boolean {
    return account.balanceLoadingState === "loading";
  }

  hasAccountBalanceError(account: AccountListItem): boolean {
    return account.balanceLoadingState === "error";
  }

  isAccountFiatLoading(account: AccountListItem): boolean {
    return account.fiatLoadingState === "loading";
  }

  hasAccountFiatError(account: AccountListItem): boolean {
    return account.fiatLoadingState === "error";
  }

  selectAccount(account: Account) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.host.requestUpdate();
    }
  }

  handleAccountCardClick(account: AccountListItem) {
    this.selectAccount(account);

    window.dispatchEvent(
      new CustomEvent<{ account: Account; status: "success" }>(
        "ledger-internal-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account, status: "success" },
        },
      ),
    );
    this.close();
  }

  handleShowTokensClick(account: AccountListItem) {
    this.navigation.navigateTo({
      name: "accountTokens",
      component: "account-tokens-screen",
      canGoBack: true,
      screenData: account,
      toolbar: {
        title: account.name,
        subtitle: this.truncateAddress(account.freshAddress),
        canClose: true,
      },
    });
  }

  handleSearchInput(event: CustomEvent<{ value: string }>) {
    this.searchQuery$.next(event.detail.value);
    this.host.requestUpdate();
  }

  handleSearchClear() {
    this.searchQuery$.next("");
    this.host.requestUpdate();
  }

  handleRefreshAccountsClick() {
    this.getAccounts({ forceRefresh: true });
  }

  handleAddAccountClick() {
    window.open("ledgerwallet://add-account", "_blank", "noopener,noreferrer");
  }

  close() {
    if (this.navigation.host instanceof RootNavigationComponent) {
      if (this.navigation.host.getModalMode() === "panel") {
        this.navigation.host.navigateToHome();
      } else {
        this.navigation.host.presentConnectionSuccessOverlay();
      }
      this.host.requestUpdate();
    }
  }

  private syncCompatibleAccountsError(): void {
    if (!this.hasLoadedGroups || this.groups.length > 0) {
      this.errorData = undefined;
      return;
    }

    // Search empties keep the inline "no results" copy; only a true empty
    // picker (no accounts for the current family/scope) uses this status UI.
    if (this.searchQuery) {
      this.errorData = undefined;
      return;
    }

    this.errorData = this.buildCompatibleAccountsError();
  }

  private buildCompatibleAccountsError(): SelectAccountErrorData {
    const copy =
      this.lang.currentTranslation.error.ledgerSync.NoCompatibleAccounts;

    return {
      title: copy.title,
      cta1: {
        label: copy.cta1,
        action: () => {
          this.errorData = undefined;
          window.open("ledgerlive://accounts");
          if (this.navigation.host instanceof RootNavigationComponent) {
            this.navigation.host.closeModal();
          }
        },
      },
      cta2: {
        label: copy.cta2,
        action: () => {
          this.errorData = undefined;
          this.navigation.navigateTo(this.destinations.onboarding);
        },
      },
    };
  }
}

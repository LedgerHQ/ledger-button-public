import "../../../shared/root-navigation.js";

import type {
  Account,
  AccountGroup,
  AccountListItem,
  BlockchainFamily,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs";

import { CoreContext } from "../../../context/core-context.js";
import { LanguageContext } from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
import { formatAddress } from "../../../utils/format-address.js";

export class SelectAccountController implements ReactiveController {
  groups: AccountGroup[] = [];
  private readonly searchQuery$ = new BehaviorSubject("");
  private groupsSubscription?: Subscription;

  get searchQuery(): string {
    return this.searchQuery$.value;
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
      group.accounts.some((account) => account.balance === undefined),
    );
  }

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
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
}

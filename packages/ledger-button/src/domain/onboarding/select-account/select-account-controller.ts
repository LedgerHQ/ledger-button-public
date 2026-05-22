import "../../../shared/root-navigation.js";

import type {
  Account,
  AccountWithFiat,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Subscription } from "rxjs";
import { of, timer } from "rxjs";
import { debounce } from "rxjs/operators";

import { CoreContext } from "../../../context/core-context.js";
import { LanguageContext } from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
import { getDisplayTokens } from "../../../utils/account-display-tokens.js";

export type AccountGroup = {
  freshAddress: string;
  accounts: AccountWithFiat[];
};

export class SelectAccountController implements ReactiveController {
  accounts: AccountWithFiat[] = [];
  searchQuery = "";
  private accountsSubscription?: Subscription;

  getDisplayTokens(account: AccountWithFiat) {
    return getDisplayTokens(account);
  }

  truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
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

  get groupedAccounts(): AccountGroup[] {
    const map = new Map<string, AccountWithFiat[]>();
    for (const account of this.filteredAccounts) {
      const group = map.get(account.freshAddress) ?? [];
      group.push(account);
      map.set(account.freshAddress, group);
    }
    return Array.from(map.entries()).map(([freshAddress, accounts]) => ({
      freshAddress,
      accounts,
    }));
  }

  get filteredAccounts(): AccountWithFiat[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return [...this.accounts];
    }

    return this.accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.freshAddress.toLowerCase().includes(query) ||
        account.ticker.toLowerCase().includes(query) ||
        account.tokens.some(
          (token) =>
            token.ticker.toLowerCase().includes(query) ||
            token.name.toLowerCase().includes(query),
        ),
    );
  }

  get isBalanceLoading(): boolean {
    return this.accounts.some((account) => account.balance === undefined);
  }

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly lang: LanguageContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccounts();
  }

  hostDisconnected() {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
      this.accountsSubscription = undefined;
    }
  }

  getAccounts(options?: { forceRefresh?: boolean }) {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
    }

    this.host.requestUpdate();

    // Emit the first batch immediately so accounts appear before balances load
    let isFirstEmission = true;

    this.accountsSubscription = this.core
      .getAccounts(options)
      .pipe(
        debounce(() => {
          if (isFirstEmission) {
            isFirstEmission = false;
            return of(0);
          }
          return timer(200);
        }),
      )
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
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

  isAccountBalanceLoading(accountId: string): boolean {
    const account = this.accounts.find((acc) => acc.id === accountId);
    return account?.balanceLoadingState === "loading";
  }

  hasAccountBalanceError(accountId: string): boolean {
    const account = this.accounts.find((acc) => acc.id === accountId);
    return account?.balanceLoadingState === "error";
  }

  isAccountFiatLoading(accountId: string): boolean {
    const account = this.accounts.find((acc) => acc.id === accountId);
    return account?.fiatLoadingState === "loading";
  }

  hasAccountFiatError(accountId: string): boolean {
    const account = this.accounts.find((acc) => acc.id === accountId);
    return account?.fiatLoadingState === "error";
  }

  getAccountFiatValue(accountId: string) {
    return this.accounts.find((acc) => acc.id === accountId)?.fiatBalance;
  }

  selectAccount(account: Account) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.host.requestUpdate();
    }
  }

  handleAccountCardClick(account: AccountWithFiat) {
    this.selectAccount(account);

    const selectedAccount = this.core.getSelectedAccount();
    window.dispatchEvent(
      new CustomEvent<{ account: Account; status: "success" }>(
        "ledger-internal-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account: selectedAccount as Account, status: "success" },
        },
      ),
    );
    this.close();
  }

  handleShowTokensClick(account: AccountWithFiat) {
    this.core.setPendingAccountId(account.id);

    this.navigation.navigateTo({
      name: "accountTokens",
      component: "account-tokens-screen",
      canGoBack: true,
      toolbar: {
        title: account.name,
        subtitle: this.truncateAddress(account.freshAddress),
        canClose: true,
      },
    });
  }

  handleSearchInput(event: CustomEvent<{ value: string }>) {
    this.searchQuery = event.detail.value;
    this.host.requestUpdate();
  }

  handleSearchClear() {
    this.searchQuery = "";
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

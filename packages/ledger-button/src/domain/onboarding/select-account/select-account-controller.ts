import "../../../shared/root-navigation.js";

import type {
  Account,
  AccountWithFiat,
  BlockchainFamily,
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
import { formatAddress } from "../../../utils/format-address.js";

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

  get groupedAccounts(): AccountGroup[] {
    const map = new Map<string, AccountWithFiat[]>();
    const totalBalances = new Map<string, number>();

    for (const account of this.filteredAccounts) {
      const group = map.get(account.freshAddress) ?? [];
      group.push(account);
      map.set(account.freshAddress, group);

      const totalBalance = totalBalances.get(account.freshAddress) ?? 0;
      const accountFiat = this.getAccountFiatValue(account);
      totalBalances.set(
        account.freshAddress,
        totalBalance + parseFloat(accountFiat?.value ?? "0"),
      );
    }

    return Array.from(map.entries())
      .sort(
        ([a], [b]) => (totalBalances.get(b) ?? 0) - (totalBalances.get(a) ?? 0),
      )
      .map(([freshAddress, accounts]) => ({
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
    private readonly family?: BlockchainFamily,
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
      .observeAccounts({ ...options, family: this.family })
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

  isAccountBalanceLoading(account: AccountWithFiat): boolean {
    return account.balanceLoadingState === "loading";
  }

  hasAccountBalanceError(account: AccountWithFiat): boolean {
    return account.balanceLoadingState === "error";
  }

  isAccountFiatLoading(account: AccountWithFiat): boolean {
    return account.fiatLoadingState === "loading";
  }

  hasAccountFiatError(account: AccountWithFiat): boolean {
    return account.fiatLoadingState === "error";
  }

  getAccountFiatValue(account: AccountWithFiat) {
    if (!account.fiatBalance) return undefined;

    const nativeFiat = parseFloat(account.fiatBalance.value);
    const tokensFiat = account.tokens.reduce((sum, token) => {
      if (!token.fiatBalance?.value) return sum;
      return sum + parseFloat(token.fiatBalance.value);
    }, 0);

    return {
      value: (nativeFiat + tokensFiat).toFixed(2),
      currency: account.fiatBalance.currency,
    };
  }

  selectAccount(account: Account) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.host.requestUpdate();
    }
  }

  handleAccountCardClick(account: AccountWithFiat) {
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

  handleShowTokensClick(account: AccountWithFiat) {
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

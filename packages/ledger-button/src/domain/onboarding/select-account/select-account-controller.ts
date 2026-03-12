import "../../../shared/root-navigation.js";

import type {
  Account,
  AccountWithFiat,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import type { AccountItemClickEventDetail } from "../../../components/molecule/account-item/ledger-account-item.js";
import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";

export class SelectAccountController implements ReactiveController {
  accounts: AccountWithFiat[] = [];
  isAccountsLoading = false;
  searchQuery = "";
  private accountsSubscription?: Subscription;

  get filteredAccounts(): AccountWithFiat[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return this.accounts;
    }
    return this.accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.freshAddress.toLowerCase().includes(query),
    );
  }

  get isBalanceLoading(): boolean {
    return this.accounts.some((account) => account.balance === undefined);
  }

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
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

  getAccounts() {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
    }

    this.isAccountsLoading = true;
    this.host.requestUpdate();

    this.accountsSubscription = this.core.getAccounts("usd").subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.isAccountsLoading = false;
        this.host.requestUpdate();
      },
      error: (error) => {
        this.isAccountsLoading = false;
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

  handleAccountItemClick(event: CustomEvent<AccountItemClickEventDetail>) {
    const account = this.accounts.find(
      (acc: Account) => acc.id === event.detail.ledgerId,
    );

    if (account) {
      this.selectAccount(account);
    }

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

  handleAccountItemShowTokensClick(
    event: CustomEvent<AccountItemClickEventDetail>,
  ) {
    const account = this.accounts.find(
      (acc: Account) => acc.id === event.detail.ledgerId,
    );

    if (account) {
      this.core.setPendingAccountId(account.id);

      this.navigation.navigateTo({
        name: "accountTokens",
        component: "account-tokens-screen",
        canGoBack: true,
        toolbar: {
          title: `${account.name}`,
          canClose: true,
        },
      });
    }
  }

  handleSearchInput(event: CustomEvent<{ value: string }>) {
    this.searchQuery = event.detail.value;
    this.host.requestUpdate();
  }

  handleSearchClear() {
    this.searchQuery = "";
    this.host.requestUpdate();
  }

  close() {
    if (this.navigation.host instanceof RootNavigationComponent) {
      if (this.navigation.host.getModalMode() === "panel") {
        this.navigation.host.navigateToHome();
      } else {
        this.navigation.host.closeModal();
      }
      this.host.requestUpdate();
    }
  }
}

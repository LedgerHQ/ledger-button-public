import "../../../shared/root-navigation.js";

import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import type { AccountItemClickEventDetail } from "../../../components/molecule/account-item/ledger-account-item.js";
import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";

type BalanceLoadingState = "loading" | "loaded" | "error";

export class SelectAccountController implements ReactiveController {
  accounts: Account[] = [];
  isAccountsLoading = false;
  balanceLoadingStates = new Map<string, BalanceLoadingState>();
  private accountsSubscription?: Subscription;
  private initialAccountsReceived = false;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.subscribeToAccounts();
  }

  hostDisconnected() {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
      this.accountsSubscription = undefined;
    }
    this.initialAccountsReceived = false;
  }

  private subscribeToAccounts() {
    this.isAccountsLoading = true;
    this.host.requestUpdate();

    this.accountsSubscription = this.core.getAccountsWithBalance().subscribe({
      next: (accounts) => {
        this.updateAccounts(accounts);
      },
      error: (error) => {
        this.isAccountsLoading = false;
        this.host.requestUpdate();
        throw error;
      },
    });
  }

  private updateAccounts(accounts: Account[]) {
    const previousAccounts = this.createPreviousAccountsMap();

    this.accounts = accounts ?? [];
    this.isAccountsLoading = false;

    if (!this.initialAccountsReceived) {
      this.initializeAccountsLoadingStates(this.accounts);
    } else {
      this.processAccountUpdates(this.accounts, previousAccounts);
    }

    this.host.requestUpdate();
  }

  private createPreviousAccountsMap(): Map<string, Account> {
    return new Map(this.accounts.map((acc) => [acc.id, acc]));
  }

  private initializeAccountsLoadingStates(accounts: Account[]): void {
    this.initialAccountsReceived = true;
    for (const account of accounts) {
      this.balanceLoadingStates.set(account.id, "loading");
    }
  }

  private processAccountUpdates(
    accounts: Account[],
    previousAccounts: Map<string, Account>,
  ): void {
    for (const account of accounts) {
      const previousAccount = previousAccounts.get(account.id);
      this.updateAccountBalanceState(account, previousAccount);
    }
  }

  private updateAccountBalanceState(
    account: Account,
    previousAccount: Account | undefined,
  ): void {
    if (account.balance !== undefined) {
      this.balanceLoadingStates.set(account.id, "loaded");
    } else if (previousAccount) {
      if (this.shouldMarkAsError(account, previousAccount)) {
        this.balanceLoadingStates.set(account.id, "error");
      }
    } else {
      this.balanceLoadingStates.set(account.id, "loading");
    }
  }

  private shouldMarkAsError(
    account: Account,
    previousAccount: Account,
  ): boolean {
    const previousBalance = previousAccount.balance;
    const currentState = this.balanceLoadingStates.get(account.id);

    return (
      previousBalance === undefined &&
      account.balance === undefined &&
      currentState === "loading"
    );
  }

  setBalanceLoadingState(accountId: string, state: BalanceLoadingState): void {
    this.balanceLoadingStates.set(accountId, state);
    this.host.requestUpdate();
  }

  getBalanceLoadingState(accountId: string): BalanceLoadingState | undefined {
    return this.balanceLoadingStates.get(accountId);
  }

  isAccountBalanceLoading(accountId: string): boolean {
    return this.balanceLoadingStates.get(accountId) === "loading";
  }

  isAccountBalanceLoaded(accountId: string): boolean {
    return this.balanceLoadingStates.get(accountId) === "loaded";
  }

  hasAccountBalanceError(accountId: string): boolean {
    return this.balanceLoadingStates.get(accountId) === "error";
  }

  selectAccount(account: Account) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.host.requestUpdate();
    }
  }

  handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    const account = this.accounts.find(
      (acc) => acc.id === event.detail.ledgerId,
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
  };

  handleAccountItemShowTokensClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    const account = this.accounts.find(
      (acc) => acc.id === event.detail.ledgerId,
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
  };

  close = () => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      if (this.navigation.host.getModalMode() === "panel") {
        this.navigation.host.navigateToHome();
      } else {
        this.navigation.host.closeModal();
      }
      this.host.requestUpdate();
    }
  };
}

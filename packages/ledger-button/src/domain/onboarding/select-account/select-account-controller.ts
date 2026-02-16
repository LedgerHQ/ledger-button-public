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
    console.log("select-account-controller: getAccounts");

    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
    }

    this.isAccountsLoading = true;
    this.host.requestUpdate();

    this.accountsSubscription = this.core.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.updateBalanceLoadingStates(accounts);
        if (this.isAccountsLoading) {
          this.isAccountsLoading = false;
        }
        this.host.requestUpdate();
      },
      error: (error) => {
        this.isAccountsLoading = false;
        console.error("Failed to fetch accounts with balance", error);
        this.host.requestUpdate();
      },
    });
  }

  private updateBalanceLoadingStates(accounts: Account[]) {
    for (const account of accounts) {
      if (account.balance !== undefined) {
        this.balanceLoadingStates.set(account.id, "loaded");
      } else {
        const currentState = this.balanceLoadingStates.get(account.id);
        if (currentState !== "error") {
          this.balanceLoadingStates.set(account.id, "loading");
        }
      }
    }
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
  };

  handleAccountItemShowTokensClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
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

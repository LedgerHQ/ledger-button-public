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
    }
  }

  async getAccounts() {
    this.isAccountsLoading = true;
    this.host.requestUpdate();

    try {
      const accounts = await this.core.fetchAccounts();
      this.accounts = accounts ?? [];
      this.isAccountsLoading = false;
      this.initializeBalanceLoadingStates();
    } catch (error) {
      this.isAccountsLoading = false;
      this.host.requestUpdate();
      throw error;
    }
  }

  private initializeBalanceLoadingStates() {
    for (const account of this.accounts) {
      if (account.balance !== undefined) {
        this.balanceLoadingStates.set(account.id, "loaded");
      } else {
        this.balanceLoadingStates.set(account.id, "loading");
      }
    }
    this.host.requestUpdate();
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
    const account = this.core
      .getAccounts()
      .find((acc) => acc.id === event.detail.ledgerId);

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
    const account = this.core
      .getAccounts()
      .find((acc) => acc.id === event.detail.ledgerId);

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

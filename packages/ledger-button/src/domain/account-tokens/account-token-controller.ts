import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context";
import { Navigation } from "../../shared/navigation";
import { RootNavigationComponent } from "../../shared/root-navigation";

export class AccountTokenController implements ReactiveController {
  account: Account | null = null;
  private accountsSubscription?: Subscription;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    // NOTE: Used for testing purposes only
    // we should not fetch the accounts again on this screen
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccount();
  }

  hostDisconnected() {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
      this.accountsSubscription = undefined;
    }
  }

  getAccount() {
    const targetId = this.core.getPendingAccountId();
    if (!targetId) {
      this.navigation.navigateBack();
      return;
    }

    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
    }

    this.accountsSubscription = this.core.getAccounts().subscribe({
      next: (accounts) => {
        this.account =
          accounts.find((acc: Account) => acc.id === targetId) ?? null;

        if (!this.account) {
          this.navigation.navigateBack();
        }

        this.host.requestUpdate();
      },
      error: (error) => {
        console.error("Failed to fetch accounts", error);
        this.navigation.navigateBack();
        this.host.requestUpdate();
      },
    });
  }

  handleConnect = () => {
    this.selectAccount(this.account);
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

  selectAccount = (account?: Account | null) => {
    if (!account) {
      return;
    }

    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
    }
  };

  close = () => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  };
}

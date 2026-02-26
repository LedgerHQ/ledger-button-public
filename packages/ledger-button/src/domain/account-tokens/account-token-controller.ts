import {
  Account,
  AccountWithFiat,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context";
import { Navigation } from "../../shared/navigation";
import { RootNavigationComponent } from "../../shared/root-navigation";

export class AccountTokenController implements ReactiveController {
  account: AccountWithFiat | null = null;
  loading = true;
  private accountsSubscription?: Subscription;
  private isFirstEmission = true;

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

    this.loading = true;
    this.isFirstEmission = true;

    this.accountsSubscription = this.core.getAccounts("usd").subscribe({
      next: (accounts) => {
        this.account =
          accounts.find((acc: AccountWithFiat) => acc.id === targetId) ?? null;

        if (!this.account) {
          this.navigation.navigateBack();
        }

        if (this.isFirstEmission) {
          this.isFirstEmission = false;
        } else {
          this.loading = false;
        }

        this.host.requestUpdate();
      },
      error: (error) => {
        console.error("Failed to fetch accounts", error);
        this.loading = false;
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

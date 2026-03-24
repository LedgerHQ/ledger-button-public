import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import {
  getAccountFiatValue,
  hasAccountBalanceError,
  hasAccountFiatError,
  isAccountBalanceLoading,
  isAccountFiatLoading,
  sortAccountsByFiatBalance,
} from "../../shared/account-helpers.js";
import { DEFAULT_FIAT_CURRENCY } from "../../shared/constants/index.js";

export class AccountRequestController implements ReactiveController {
  accounts: AccountWithFiat[] = [];
  isLoading = false;
  private accountsSubscription?: Subscription;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.loadAccounts();
  }

  hostDisconnected() {
    this.accountsSubscription?.unsubscribe();
    this.accountsSubscription = undefined;
  }

  private loadAccounts() {
    this.accountsSubscription?.unsubscribe();

    this.isLoading = true;
    this.host.requestUpdate();

    this.accountsSubscription = this.core
      .getAccounts(DEFAULT_FIAT_CURRENCY)
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.isLoading = false;
          this.host.requestUpdate();
        },
        error: (error) => {
          this.isLoading = false;
          console.error(
            "Failed to fetch accounts for account request",
            error,
          );
          this.host.requestUpdate();
        },
        complete: () => {
          this.host.requestUpdate();
        },
      });
  }

  get sortedAccounts(): AccountWithFiat[] {
    return sortAccountsByFiatBalance(this.accounts);
  }

  isAccountBalanceLoading(accountId: string): boolean {
    return isAccountBalanceLoading(this.accounts, accountId);
  }

  hasAccountBalanceError(accountId: string): boolean {
    return hasAccountBalanceError(this.accounts, accountId);
  }

  isAccountFiatLoading(accountId: string): boolean {
    return isAccountFiatLoading(this.accounts, accountId);
  }

  hasAccountFiatError(accountId: string): boolean {
    return hasAccountFiatError(this.accounts, accountId);
  }

  getAccountFiatValue(accountId: string) {
    return getAccountFiatValue(this.accounts, accountId);
  }

  handleAllow() {
    console.log("Account request approved", {
      accounts: this.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        address: a.freshAddress,
      })),
    });
  }

  handleReject() {
    console.log("Account request rejected");
  }
}

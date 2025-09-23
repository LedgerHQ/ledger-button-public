import { Account } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../../context/core-context";
import { Navigation } from "../../shared/navigation";
import { RootNavigationComponent } from "../../shared/root-navigation";

export class AccountTokenController implements ReactiveController {
  account: Account | null = null;

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

  getAccount() {
    if (this.account) {
      return;
    }

    const targetAddress = this.core.getPendingAccountAddress();
    this.account =
      this.core
        .getAccounts()
        .find((acc) => acc.freshAddress === targetAddress) || null;

    // If the account is not found, navigate back to account list
    if (!this.account) {
      this.navigation.navigateBack();
    }

    this.host.requestUpdate();
  }

  connectAccount() {
    console.log("connectAccount", this.account!.freshAddress);

    if (this.navigation.host instanceof RootNavigationComponent) {
      console.log(
        "connectAccount send selectAccount event",
        this.account!.freshAddress,
      );
      this.navigation.host.selectAccount(this.account!.freshAddress); //If
      this.host.requestUpdate();
    }
  }
}

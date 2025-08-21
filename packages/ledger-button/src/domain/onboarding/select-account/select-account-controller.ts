import "../../../shared/root-navigation.js";

import { Account } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
// import { destinations } from "../../../shared/routes.js";

export class SelectAccountController implements ReactiveController {
  accounts: Account[] = [];

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    // NOTE: Used for testing purposes only
    // we should not fetch the accounts again on this screen
    private shouldRefreshAccounts = false,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    if (this.shouldRefreshAccounts) {
      this.core.fetchAccounts().then(() => {
        this.getAccounts();
      });
      return;
    }

    this.getAccounts();
  }

  async getAccounts() {
    const accounts = await this.core.getAccounts();
    this.accounts = accounts ?? [];
    this.host.requestUpdate();
  }

  selectAccount(address: string) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(address);
      this.host.requestUpdate();
    }
  }
}

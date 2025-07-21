import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { destinations } from "../../../shared/routes.js";

export class RetrievingAccountsController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.fetchAccounts();
  }

  async fetchAccounts() {
    await this.core.fetchAccounts();
    this.host.requestUpdate();

    setTimeout(() => {
      this.navigation.navigateTo(destinations.selectAccount);
    }, 3000);
  }
}

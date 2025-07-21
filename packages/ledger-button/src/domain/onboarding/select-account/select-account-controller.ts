import { Account, LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
// import { destinations } from "../../../shared/routes.js";

export class SelectAccountController implements ReactiveController {
  host: ReactiveControllerHost;
  accounts: Account[] = [];

  constructor(
    host: ReactiveControllerHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccounts();
  }

  async getAccounts() {
    // TODO: For linter purpose only, remove this when done
    console.log(this.navigation);
    const accounts = await this.core.fetchAccounts();
    this.accounts = accounts ?? [];
    this.host.requestUpdate();
  }
}

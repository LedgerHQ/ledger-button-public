import { type ReactiveController, type ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { type Destinations } from "../../../shared/routes.js";

export class RetrievingAccountsController implements ReactiveController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.fetchAccounts();
  }

  async fetchAccounts() {
    const accounts = await this.core.fetchAccounts();
    this.host.requestUpdate();
    console.info("fetchAccounts", accounts);
    if (!accounts || accounts.length === 0) {
      this.navigation.navigateTo(this.destinations.turnOnSync);
      return;
    }

    this.navigation.navigateTo(this.destinations.selectAccount);
    /*
    setTimeout(() => {
    }, 5000);
    */
  }
}

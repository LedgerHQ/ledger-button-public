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
    await this.core.fetchAccounts();
    const accounts = await this.core.getAccounts();
    this.host.requestUpdate();

    setTimeout(() => {
      if (!accounts || accounts.length === 0) {
        this.navigation.navigateTo(this.destinations.onboarding);
        return;
      }

      this.navigation.navigateTo(this.destinations.selectAccount);
    }, 3000);
  }
}

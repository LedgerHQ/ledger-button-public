import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";

export class LedgerHomeController implements ReactiveController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly demoMode: boolean,
  ) {
    this.host.addController(this);
  }

  getSelectedAccount() {
    return this.core.getSelectedAccount();
  }

  async handleDisconnectClick() {
    await this.core.disconnect();
    this.navigation.navigateTo(this.destinations.onboarding);
  }

  hostConnected() {
    if (this.demoMode) {
      this.core.fetchAccounts().then(() => {
        this.core.selectAccount(this.core.getAccounts()[0].freshAddress);
        this.host.requestUpdate();
      });
    }
  }
}

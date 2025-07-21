import { Device, LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { destinations } from "../../../shared/routes.js";

export class FollowInstructionsController implements ReactiveController {
  host: ReactiveControllerHost;
  device?: Device;

  constructor(
    host: ReactiveControllerHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.getConnectedDevice();
  }

  async getConnectedDevice() {
    const device = await this.core.getConnectedDevice();

    if (!device) {
      this.navigation.navigateTo(destinations.onboarding);
      this.host.requestUpdate();
      return;
    }

    this.device = device;
    this.host.requestUpdate();

    // TODO: PLUG LKRP
    setTimeout(() => {
      this.navigation.navigateTo(destinations.fetchAccounts);
    }, 3000);
  }
}

import { Device, LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";

export class LedgerSyncController implements ReactiveController {
  host: ReactiveControllerHost;
  device?: Device;

  constructor(
    host: ReactiveControllerHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
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
      this.navigation.navigateTo(this.destinations.onboarding);
      this.host.requestUpdate();
      return;
    }

    this.device = device;
    this.host.requestUpdate();

    // TODO: PLUG LKRP
    // setTimeout(() => {
    //   this.navigation.navigateTo(destinations.fetchAccounts);
    // }, 3000);
  }
}

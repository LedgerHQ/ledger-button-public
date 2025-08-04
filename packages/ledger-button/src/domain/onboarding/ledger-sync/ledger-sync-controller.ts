import { Device, SignTransactionParams } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";

export class LedgerSyncController implements ReactiveController {
  device?: Device;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly pendingTransactionParams?: SignTransactionParams,
  ) {
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

    if (this.pendingTransactionParams) {
      this.navigation.navigateTo(this.destinations.signTransaction);
      this.host.requestUpdate();
      return;
    }

    // TODO: PLUG LKRP
    setTimeout(() => {
      this.navigation.navigateTo(this.destinations.fetchAccounts);
    }, 3000);
  }
}

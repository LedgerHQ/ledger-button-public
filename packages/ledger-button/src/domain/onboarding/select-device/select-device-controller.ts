import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";

export class SelectDeviceController implements ReactiveController {
  host: ReactiveControllerHost;

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
    this.host.requestUpdate();
  }

  async clickAdItem() {
    console.log("clickAdItem");
  }

  async connectToDevice(detail: {
    title: string;
    connectionType: "bluetooth" | "usb" | "";
    timestamp: number;
  }) {
    if (detail.connectionType === "") {
      console.log("No connection type selected");
      return;
    }

    try {
      await this.core.connectToDevice(detail.connectionType);

      const pendingTransactionParams = this.core.getPendingTransactionParams();

      if (pendingTransactionParams) {
        this.navigation.navigateTo(this.destinations.signTransaction);
      } else {
        this.navigation.navigateTo(this.destinations.ledgerSync);
      }
    } catch (error) {
      console.error("Failed to connect to device", error);
      // this.navigation.navigateTo(destinations.onboarding);
    }
  }
}

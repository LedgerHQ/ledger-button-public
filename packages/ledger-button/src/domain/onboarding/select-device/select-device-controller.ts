import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { destinations } from "../../../shared/routes.js";

export class SelectDeviceController implements ReactiveController {
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
    this.host.requestUpdate();
  }

  async connectToDevice(detail: {
    title: string;
    connectionType: "bluetooth" | "usb";
    timestamp: number;
  }) {
    try {
      await this.core.connectToDevice(detail.connectionType);
      this.navigation.navigateTo(destinations.followInstructions);
    } catch (error) {
      console.error("Failed to connect to device", error);
    }
  }
}

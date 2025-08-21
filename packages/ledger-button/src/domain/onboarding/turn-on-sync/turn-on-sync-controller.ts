import { Device } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";

export class TurnOnSyncController implements ReactiveController {
  host: ReactiveControllerHost;
  device?: Device;

  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  handleTurnOnSync() {
    // TODO: Redirect to website ? Ledger Live ?
    console.log("turn on sync");
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
    }
  }

  handleLearnMore() {
    // TODO: Open the learn more page
    // window.open("https://www.ledger.com/ledger-sync", "_blank");
    console.log("learn more");
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
    }
  }
}

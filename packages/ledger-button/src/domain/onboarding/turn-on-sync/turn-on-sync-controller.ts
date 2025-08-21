import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";

export class TurnOnSyncController implements ReactiveController {
  host: ReactiveControllerHost;

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
    window.open("ledgerlive://ledgersync");
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
    }
  }

  handleLearnMore() {
    window
      .open(
        "https://support.ledger.com/article/How-to-synchronize-your-Ledger-Live-accounts-with-Ledger-Sync",
        "_blank",
      )
      ?.focus();

    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
    }
  }
}

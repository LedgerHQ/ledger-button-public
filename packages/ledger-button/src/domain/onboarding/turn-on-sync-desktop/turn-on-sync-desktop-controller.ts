import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation";
import { RootNavigationComponent } from "../../../shared/root-navigation";
import { Destinations } from "../../../shared/routes";

export class TurnOnSyncDesktopController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  handleTurnOnLedgerSync() {
    window.open("https://go.ledger.com/ledger/ledgersync", "_blank", "noopener,noreferrer");
  }

  handleLedgerSyncActivated() {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
    }
  }
}

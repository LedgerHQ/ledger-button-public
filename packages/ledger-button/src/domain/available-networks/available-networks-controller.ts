import "../../shared/root-navigation.js";

import { type Network } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";

export class AvailableNetworksController implements ReactiveController {
  networks: Network[] = [];
  loading = true;
  private networksSubscription?: Subscription;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.loading = true;
    this.host.requestUpdate();

    this.networksSubscription = this.core
      .observeNetworksForSelectedAddress()
      .subscribe({
        next: (networks) => {
          if (!networks.length) {
            this.navigation.navigateBack();
            return;
          }

          this.networks = networks;
          this.loading = false;
          this.host.requestUpdate();
        },
        error: () => {
          this.loading = false;
          this.host.requestUpdate();
        },
      });
  }

  hostDisconnected() {
    this.networksSubscription?.unsubscribe();
    this.networksSubscription = undefined;
  }

  selectNetwork(networkId: string) {
    if (!this.core.selectAccountForNetwork(networkId)) {
      return;
    }

    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.navigateToHome();
      this.host.requestUpdate();
    }
  }
}

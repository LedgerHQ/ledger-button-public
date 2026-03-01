import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";

export class AvailableNetworksController implements ReactiveController {
  networks: Network[] = [];
  loading = true;
  private contextSubscription?: Subscription;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.fetchNetworks();
  }

  hostDisconnected() {
    this.contextSubscription?.unsubscribe();
  }

  private async fetchNetworks() {
    this.loading = true;
    this.host.requestUpdate();

    const result = await this.core.getDetailedSelectedAccount();

    result.caseOf({
      Left: () => {
        this.navigation.navigateBack();
      },
      Right: (account) => {
        this.networks = account.networks;
      },
    });

    this.loading = false;
    this.host.requestUpdate();
  }
}

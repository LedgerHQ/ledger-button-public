import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { firstValueFrom } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";

export class AvailableNetworksController implements ReactiveController {
  networks: Network[] = [];
  loading = true;
  private disconnected = false;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.disconnected = false;
    this.fetchNetworks();
  }

  hostDisconnected() {
    this.disconnected = true;
  }

  private async fetchNetworks() {
    this.loading = true;
    this.host.requestUpdate();

    try {
      const currentContext = await firstValueFrom(this.core.observeContext());
      const selectedAddress = currentContext.selectedAccount?.freshAddress;

      if (!selectedAddress) {
        this.navigation.navigateBack();
        return;
      }

      const networks = await this.core.getNetworksForAddress(selectedAddress);

      if (this.disconnected) return;

      if (!networks.length) {
        this.navigation.navigateBack();
        return;
      }

      this.networks = this.sortByFiatValue(networks);
    } catch {
      if (this.disconnected) return;
      this.navigation.navigateBack();
    } finally {
      if (!this.disconnected) {
        this.loading = false;
        this.host.requestUpdate();
      }
    }
  }

  private sortByFiatValue(networks: Network[]): Network[] {
    return [...networks].sort((a, b) => {
      const aVal = a.fiatBalance?.value ? parseFloat(a.fiatBalance.value) : 0;
      const bVal = b.fiatBalance?.value ? parseFloat(b.fiatBalance.value) : 0;
      return bVal - aVal;
    });
  }
}

import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../../context/core-context";
import type { Navigation } from "../../../../shared/navigation";
import type { Destinations } from "../../../../shared/routes";

export type BlockchainNetworkScreenData = {
  blockchainId: string;
  displayName: string;
};

export class BlockchainNetworkController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly blockchainId: string,
    private readonly displayName: string,
  ) {
    host.addController(this as ReactiveController);
  }

  get networks(): BlockchainNetwork[] {
    return this.core.getBlockchainNetworks(this.blockchainId);
  }

  get hasOverrides(): boolean {
    return this.core.hasNetworkOverrides(this.blockchainId);
  }

  resetOverrides(): void {
    this.core.resetNetworkOverrides(this.blockchainId);
    this.host.requestUpdate();
  }

  navigateToAddNetwork(): void {
    this.navigation.navigateTo({
      ...this.destinations.addNetwork,
      screenData: {
        blockchainId: this.blockchainId,
        displayName: this.displayName,
      },
    });
  }
}

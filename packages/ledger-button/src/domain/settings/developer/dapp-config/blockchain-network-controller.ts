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
    host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly blockchainId: string,
    private readonly displayName: string,
    private readonly invalidate: () => void,
  ) {
    host.addController(this as ReactiveController);
  }

  get networks(): BlockchainNetwork[] {
    return this.core.getBlockchainNetworks(this.blockchainId);
  }

  get hasOverrides(): boolean {
    return this.core.getConfigOverrides().networkOverrides.length > 0;
  }

  resetOverrides(): void {
    this.core.setConfigOverrides({ networkOverrides: [] });
    this.invalidate();
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

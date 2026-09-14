import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../../context/core-context";
import type { Navigation } from "../../../../shared/navigation";
import type { Destinations } from "../../../../shared/routes";

export type BlockchainItem = {
  id: string;
  displayName: string;
};

const BUILT_IN_BLOCKCHAINS: BlockchainItem[] = [
  { id: "ethereum", displayName: "Ethereum" },
  { id: "solana", displayName: "Solana" },
];

export class DappConfigController {
  constructor(
    host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    host.addController(this as ReactiveController);
  }

  get blockchains(): BlockchainItem[] {
    return BUILT_IN_BLOCKCHAINS;
  }

  navigateToBlockchainNetworks(item: BlockchainItem): void {
    // Resolve networks eagerly here — _dappConfig is guaranteed to be set
    // by the time the user reaches this screen.
    const baseNetworks: BlockchainNetwork[] = this.core.getBlockchainNetworks(
      item.id,
    );

    this.navigation.navigateTo({
      ...this.destinations.blockchainNetworks,
      toolbar: {
        ...this.destinations.blockchainNetworks.toolbar,
        title: item.displayName,
      },
      screenData: {
        blockchainId: item.id,
        displayName: item.displayName,
        baseNetworks,
      },
    });
  }
}

import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { Navigation } from "../../../../shared/navigation";
import type { Destinations } from "../../../../shared/routes";

export type BlockchainItem = {
  id: string;
  displayName: string;
};

const BUILT_IN_BLOCKCHAINS: BlockchainItem[] = [
  { id: "ethereum", displayName: "Ethereum" },
];

export class DappConfigController {
  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    host.addController(this as ReactiveController);
  }

  get blockchains(): BlockchainItem[] {
    return BUILT_IN_BLOCKCHAINS;
  }

  navigateToBlockchainNetworks(item: BlockchainItem): void {
    this.navigation.navigateTo({
      ...this.destinations.blockchainNetworks,
      toolbar: {
        ...this.destinations.blockchainNetworks.toolbar,
        title: item.displayName,
      },
      screenData: {
        blockchainId: item.id,
        displayName: item.displayName,
      },
    });
  }
}

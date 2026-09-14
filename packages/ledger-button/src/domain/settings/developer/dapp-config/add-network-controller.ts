import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { Navigation } from "../../../../shared/navigation";
import { BlockchainNetworkController } from "./blockchain-network-controller";
import { addNetworkOverride } from "./configOverridesStorage";

export class AddNetworkController {
  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
    private readonly blockchainId: string,
  ) {
    host.addController(this as ReactiveController);
  }

  addNetwork(network: BlockchainNetwork): void {
    addNetworkOverride(this.blockchainId, network);
    BlockchainNetworkController.markPendingReload(this.blockchainId, network);
    this.navigation.navigateBack();
  }

  cancel(): void {
    this.navigation.navigateBack();
  }
}

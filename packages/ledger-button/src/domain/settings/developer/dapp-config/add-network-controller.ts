import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../../context/core-context";
import type { Navigation } from "../../../../shared/navigation";

export class AddNetworkController {
  constructor(
    host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    host.addController(this as ReactiveController);
  }

  addNetwork(network: BlockchainNetwork): void {
    this.core.setConfigOverrides({
      networkOverrides: [
        ...this.core.getConfigOverrides().networkOverrides,
        network,
      ],
    });
    this.navigation.navigateBack();
  }

  cancel(): void {
    this.navigation.navigateBack();
  }
}

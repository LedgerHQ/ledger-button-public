import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../../context/core-context";
import type { Navigation } from "../../../../shared/navigation";
import type { Destinations } from "../../../../shared/routes";

const EVM_FAMILY = "ethereum";

export class BlockchainNetworkController {
  constructor(
    host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly invalidate: () => void,
  ) {
    host.addController(this as ReactiveController);
  }

  get networks(): BlockchainNetwork[] {
    return this.core.getBlockchainNetworks(EVM_FAMILY);
  }

  get hasOverrides(): boolean {
    return this.core.getConfigOverrides().length > 0;
  }

  resetOverrides(): void {
    this.core.setConfigOverrides([]);
    this.invalidate();
  }

  navigateToAddNetwork(): void {
    this.navigation.navigateTo(this.destinations.addNetwork);
  }
}

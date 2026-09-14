import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveController, ReactiveControllerHost } from "lit";

import type { Navigation } from "../../../../shared/navigation";
import type { Destinations } from "../../../../shared/routes";
import {
  hasNetworkOverrides,
  resetNetworkOverrides,
} from "./configOverridesStorage";

export type BlockchainNetworkScreenData = {
  blockchainId: string;
  displayName: string;
  baseNetworks: BlockchainNetwork[];
};

// Survive navigation but reset on page reload (module-level memory).
let pendingReload = false;
const sessionNetworks: Map<string, BlockchainNetwork[]> = new Map();

export class BlockchainNetworkController {
  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly blockchainId: string,
    private readonly displayName: string,
    private readonly baseNetworks: BlockchainNetwork[],
  ) {
    host.addController(this as ReactiveController);
  }

  get networks(): BlockchainNetwork[] {
    const added = sessionNetworks.get(this.blockchainId) ?? [];
    return [...this.baseNetworks, ...added];
  }

  get pendingReload(): boolean {
    return pendingReload;
  }

  get hasOverrides(): boolean {
    return hasNetworkOverrides(this.blockchainId);
  }

  static markPendingReload(blockchainId: string, network: BlockchainNetwork): void {
    pendingReload = true;
    const existing = sessionNetworks.get(blockchainId) ?? [];
    sessionNetworks.set(blockchainId, [...existing, network]);
  }

  resetOverrides(): void {
    resetNetworkOverrides(this.blockchainId);
    window.location.reload();
  }

  reload(): void {
    window.location.reload();
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

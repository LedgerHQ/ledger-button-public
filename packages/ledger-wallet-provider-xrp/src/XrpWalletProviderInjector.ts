import type {
  BlockchainFamily,
  WalletProviderInjector,
} from "@ledgerhq/ledger-wallet-provider-core";

import { registerXrpProvider } from "./utils/registerXrpProvider";
import { XRP_FAMILY } from "./utils/xrpUtils";
import type { XrpWalletProvider } from "./XrpWalletProvider";

/**
 * XRP {@link WalletProviderInjector}: announces the {@link XrpWalletProvider}
 * to dApps and returns a full teardown.
 *
 * Created by {@link XrpBlockchainProvider}; the wallet provider instance is an
 * internal implementation detail and is not exposed.
 */
export class XrpWalletProviderInjector implements WalletProviderInjector {
  public readonly family: BlockchainFamily = XRP_FAMILY;

  constructor(private readonly walletProvider: XrpWalletProvider) {}

  inject(): () => void {
    const unregister = registerXrpProvider(this.walletProvider);

    return () => {
      void this.walletProvider.disconnect();
      unregister();
    };
  }
}

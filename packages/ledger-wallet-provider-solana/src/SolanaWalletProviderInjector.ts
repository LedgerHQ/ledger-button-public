import type {
  BlockchainFamily,
  WalletProviderInjector,
} from "@ledgerhq/ledger-wallet-provider-core";

import { registerWalletStandard } from "./utils/registerWalletStandard";
import type { SolanaWalletProvider } from "./SolanaWalletProvider";

/**
 * Solana {@link WalletProviderInjector}: registers the {@link SolanaWalletProvider} via
 * the Wallet Standard and returns a full teardown.
 *
 * Created by {@link SolanaBlockchainProvider}; the wallet instance is an
 * internal implementation detail and is not exposed.
 */
export class SolanaWalletProviderInjector implements WalletProviderInjector {
  public readonly family: BlockchainFamily = "solana";

  constructor(private readonly walletProvider: SolanaWalletProvider) {}

  inject(): () => void {
    const unregister = registerWalletStandard(this.walletProvider);

    return () => {
      void this.walletProvider.features["standard:disconnect"].disconnect();
      unregister();
    };
  }
}

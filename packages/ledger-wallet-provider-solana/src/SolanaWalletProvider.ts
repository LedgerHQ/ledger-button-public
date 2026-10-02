import type {
  BlockchainFamily,
  WalletProvider,
} from "@ledgerhq/ledger-wallet-provider-core";

import { registerWalletStandard } from "./utils/registerWalletStandard";
import type { LedgerSolanaWallet } from "./LedgerSolanaWallet";

/**
 * Solana {@link WalletProvider}: registers the {@link LedgerSolanaWallet} via
 * the Wallet Standard and returns a full teardown.
 *
 * Created by {@link SolanaBlockchainProvider}; the wallet instance is an
 * internal implementation detail and is not exposed.
 */
export class SolanaWalletProvider implements WalletProvider {
  public readonly family: BlockchainFamily = "solana";

  constructor(private readonly wallet: LedgerSolanaWallet) {}

  init(): () => void {
    const unregister = registerWalletStandard(this.wallet);

    return () => {
      void this.wallet.features["standard:disconnect"].disconnect();
      unregister();
    };
  }
}

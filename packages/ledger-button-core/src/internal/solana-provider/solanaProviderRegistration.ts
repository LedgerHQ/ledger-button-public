import type { ChainProviderRegistration } from "../provider-registration/ChainProviderRegistration.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { registerWalletStandard } from "./registerWalletStandard.js";

/**
 * Announces the Ledger wallet to Solana dApps through the
 * [Wallet Standard](https://github.com/wallet-standard/wallet-standard) so it is
 * discoverable via `@solana/wallet-adapter` and similar libraries.
 */
export const solanaProviderRegistration: ChainProviderRegistration = {
  chain: "solana",
  register({ core, app }) {
    const wallet = new LedgerSolanaWallet(core, app);
    const unregister = registerWalletStandard(wallet);

    return () => {
      void wallet.features["standard:disconnect"].disconnect();
      unregister();
    };
  },
};

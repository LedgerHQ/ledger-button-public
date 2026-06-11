import { registerWallet } from "@wallet-standard/wallet";

import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  CoreFacingWalletProvider,
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProviderHost,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";

/**
 * Solana {@link CoreFacingWalletProvider}: a blackbox `WalletProvider` whose
 * `init()` registers the Wallet Standard wallet and returns a best-effort
 * teardown (Wallet Standard has no unregister API yet - LBD-578).
 */
export class SolanaWalletProvider implements CoreFacingWalletProvider {
  public readonly family: BlockchainFamily = "solana";
  private readonly wallet: LedgerSolanaWallet;

  constructor(
    host: WalletProviderHost,
    private readonly configFactory?: ProviderDAppConfigFactory,
  ) {
    this.wallet = new LedgerSolanaWallet(host);
  }

  init(): () => void {
    registerWallet(this.wallet);

    return () => {
      // Wallet Standard has no unregister API; clear connected accounts as a
      // best-effort teardown. Full unregister is handled in LBD-578.
      void this.wallet.features["standard:disconnect"].disconnect();
    };
  }

  setSelectedAccount(account: Account | undefined): void {
    this.wallet.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.wallet.setNetwork(chainId);
  }

  getWallet(): LedgerSolanaWallet {
    return this.wallet;
  }

  /** dApp config for this family; available only (not yet used for routing). */
  getDAppConfig(): Promise<ProviderDAppConfig | undefined> {
    return this.configFactory?.(this.family) ?? Promise.resolve(undefined);
  }
}

import { registerWalletStandard } from "./utils/registerWalletStandard.js";
import type {
  BlockchainFamily,
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProvider,
  WalletProviderCore,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";

/**
 * Solana {@link WalletProvider}: registers the Wallet Standard wallet via
 * {@link registerWalletStandard} and returns a full teardown.
 *
 * It wraps the {@link LedgerSolanaWallet}, which implements
 * {@link BlockchainProvider} (setSelectedAccount / setNetwork) and talks to
 * core through the {@link WalletProviderCore}.
 */
export class SolanaWalletProvider implements WalletProvider {
  public readonly family: BlockchainFamily = "solana";
  private readonly wallet: LedgerSolanaWallet;

  constructor(
    host: WalletProviderCore,
    private readonly configFactory?: ProviderDAppConfigFactory,
  ) {
    this.wallet = new LedgerSolanaWallet(host);
  }

  init(): () => void {
    const unregister = registerWalletStandard(this.wallet);

    return () => {
      void this.wallet.features["standard:disconnect"].disconnect();
      unregister();
    };
  }

  getWallet(): LedgerSolanaWallet {
    return this.wallet;
  }

  /** dApp config for this family; available only (not yet used for routing). */
  getDAppConfig(): Promise<ProviderDAppConfig | undefined> {
    return this.configFactory?.(this.family) ?? Promise.resolve(undefined);
  }
}

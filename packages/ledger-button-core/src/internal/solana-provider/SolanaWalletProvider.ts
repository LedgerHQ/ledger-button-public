import { registerWalletStandard } from "./utils/registerWalletStandard.js";
import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  BlockchainProvider,
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProviderHost,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";

/**
 * Solana {@link BlockchainProvider}: a blackbox `WalletProvider` whose
 * `init()` registers the Wallet Standard wallet via {@link registerWalletStandard}
 * and returns a full teardown (removes the `app-ready` listener and calls all
 * app-provided unregister callbacks).
 */
export class SolanaWalletProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "solana";
  private readonly wallet: LedgerSolanaWallet;

  constructor(
    host: WalletProviderHost,
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

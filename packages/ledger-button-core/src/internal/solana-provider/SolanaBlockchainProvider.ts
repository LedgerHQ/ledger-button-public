import { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  BlockchainProvider,
  CoreFacade,
} from "../blockchain-provider/model/BlockchainProvider.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

/**
 * Solana {@link BlockchainProvider}: entry point for the Solana family.
 *
 * Created by {@link DefaultBlockchainProviderManager} with core and dApp
 * config; wiring happens in {@link injectWalletProviders}.
 */
export class SolanaBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "solana";
  private wallet?: LedgerSolanaWallet;
  private walletProvider?: SolanaWalletProvider;

  constructor(
    private readonly core: CoreFacade,
    _dappConfig: DAppConfigV2,
  ) {}

  injectWalletProviders(): void {
    this.wallet = new LedgerSolanaWallet(this.core);
    this.walletProvider = new SolanaWalletProvider(this.wallet);
    this.walletProvider.init();
  }

  setSelectedAccount(account: Account | undefined): void {
    this.wallet?.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.wallet?.setNetwork(chainId);
  }
}

import { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import { isSupportedSolanaCurrency } from "./ledger-solana-wallet/utils/clusterUtils.js";
import type { ProviderAccount } from "../../api/model/blockchain/ProviderAccount.js";
import type { BlockchainConfig } from "../../api/model/dappConfig/BlockchainConfig.js";
import type { BlockchainProvider } from "../blockchain-provider/model/BlockchainProvider.js";
import type { CoreFacade } from "../blockchain-provider/model/CoreFacade.js";
import type { BlockchainFamily } from "../blockchain-provider/model/types.js";
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
    public readonly dappConfig: BlockchainConfig,
  ) {}

  injectWalletProviders(): void {
    this.wallet = new LedgerSolanaWallet(this.core);
    this.walletProvider = new SolanaWalletProvider(this.wallet);
    this.walletProvider.init();
  }

  setSelectedAccount(account: ProviderAccount | undefined): void {
    this.wallet?.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.wallet?.setNetwork(chainId);
  }

  isSupportedCurrency(currencyId: string): boolean {
    return isSupportedSolanaCurrency(currencyId);
  }
}

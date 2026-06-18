import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  BlockchainProvider,
  WalletProvider,
  WalletProviderCore,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

/**
 * Solana {@link BlockchainProvider}: entry point for the Solana family.
 *
 * Creates the inner {@link LedgerSolanaWallet} and the {@link SolanaWalletProvider}
 * (Wallet Standard registrar), then forwards context updates from core to the wallet.
 */
export class SolanaBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "solana";
  private readonly wallet: LedgerSolanaWallet;
  private readonly walletProvider: SolanaWalletProvider;

  constructor(host: WalletProviderCore) {
    this.wallet = new LedgerSolanaWallet(host);
    this.walletProvider = new SolanaWalletProvider(this.wallet);
  }

  getWalletProvider(): WalletProvider {
    return this.walletProvider;
  }

  setSelectedAccount(account: Account | undefined): void {
    this.wallet.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.wallet.setNetwork(chainId);
  }
}

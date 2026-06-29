import type { ProviderAccount } from "../../../api/model/blockchain/ProviderAccount.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import type { BlockchainFamily } from "./types.js";

/**
 * Entry point for a concrete blockchain family implementation (EVM, Solana, …).
 *
 * Wired once by {@link DefaultBlockchainProviderManager}; core then pushes
 * selected account / network through the context methods.
 */
export interface BlockchainProvider {
  readonly family: BlockchainFamily;
  readonly dappConfig: BlockchainConfig;
  /**
   * Wire the provider with the core host and dApp config and announce it to
   * the dApp (EIP-6963 / Wallet Standard).
   *
   * Called once by {@link DefaultBlockchainProviderManager} after the dApp
   * config has been fetched.
   */
  injectWalletProviders(): void;
  setSelectedAccount(account: ProviderAccount | undefined): void;
  setNetwork(chainId: number): void;
  /**
   * Whether the given Ledger `currencyId` belongs to this provider's family.
   * Owned by the provider so core never reaches into family-specific chain
   * tables.
   */
  isSupportedCurrency(currencyId: string): boolean;
}

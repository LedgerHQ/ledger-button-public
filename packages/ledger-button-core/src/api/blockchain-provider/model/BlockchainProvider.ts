import type { ProviderAccount } from "@api/model/blockchain/ProviderAccount";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig";

import type { CurrencyDescriptor } from "./CurrencyDescriptor";
import type { BlockchainFamily } from "./types";

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
   * Everything this family knows about a Ledger `currencyId` it owns, or
   * `undefined` when the currency belongs to another family. Owned by the
   * provider so core never reaches into family-specific chain tables.
   */
  describeCurrency(currencyId: string): CurrencyDescriptor | undefined;
  /**
   * Reverse lookup of {@link describeCurrency}, keyed by network id (EVM
   * chainId as a string, Solana cluster), for when core only has a network id.
   */
  describeNetwork(networkId: string): CurrencyDescriptor | undefined;
}

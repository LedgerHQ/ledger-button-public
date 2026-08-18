import type {
  BlockchainConfig,
  BlockchainProvider,
  BlockchainProviderFactory,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";

import { SolanaBlockchainProvider } from "./SolanaBlockchainProvider.js";

export type { SolanaSignedResult } from "./model/SolanaSignedResult.js";
export { SolanaBlockchainProvider } from "./SolanaBlockchainProvider.js";

/**
 * Factory that creates a Solana {@link BlockchainProvider}. Register with
 * `blockchainProviderFactories` on {@link LedgerButtonCore} options.
 */
export const createSolanaBlockchainProvider: BlockchainProviderFactory = (
  core: CoreFacade,
  config: BlockchainConfig,
): BlockchainProvider => new SolanaBlockchainProvider(core, config);

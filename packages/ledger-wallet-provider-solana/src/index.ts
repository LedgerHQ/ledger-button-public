import type {
  BlockchainConfig,
  BlockchainProvider,
  BlockchainProviderFactory,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";

import { SolanaBlockchainProvider } from "./SolanaBlockchainProvider";

export type { SolanaSignedResult } from "./model/SolanaSignedResult";
export {
  CommonSolanaErrorCode,
  type SolanaCluster,
  type SolanaJSONRPCRequest,
  type SolanaJsonRpcResponse,
  type SolanaJsonRpcResponseError,
  type SolanaJsonRpcResponseSuccess,
} from "./model/SolanaTypes";
export { SolanaBlockchainProvider } from "./SolanaBlockchainProvider";

/**
 * Factory that creates a Solana {@link BlockchainProvider}. Register with
 * `blockchainProviderFactories` on {@link LedgerButtonCore} options.
 */
export const createSolanaBlockchainProvider: BlockchainProviderFactory = (
  core: CoreFacade,
  config: BlockchainConfig,
): BlockchainProvider => new SolanaBlockchainProvider(core, config);

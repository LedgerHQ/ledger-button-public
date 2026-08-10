import type {
  BlockchainConfig,
  BlockchainProvider,
  BlockchainProviderFactory,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";

import { EvmBlockchainProvider } from "./EvmBlockchainProvider.js";

export { EvmBlockchainProvider } from "./EvmBlockchainProvider.js";
export { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";
export type { EvmSignedResult } from "./model/EvmSignedResult.js";
export { isBlockingRequestMethod } from "./utils/isBlockingRequestMethod.js";

/**
 * Factory that creates an EVM {@link BlockchainProvider}. Register with
 * `blockchainProviderFactories` on {@link LedgerButtonCore} options.
 */
export const createEvmBlockchainProvider: BlockchainProviderFactory = (
  core: CoreFacade,
  config: BlockchainConfig,
): BlockchainProvider => new EvmBlockchainProvider(core, config);

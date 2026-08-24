import type {
  BlockchainConfig,
  BlockchainProvider,
  BlockchainProviderFactory,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";

import { EvmBlockchainProvider } from "./EvmBlockchainProvider";

export { EvmBlockchainProvider } from "./EvmBlockchainProvider";
export { LedgerEIP1193Provider } from "./LedgerEIP1193Provider";
export * from "./model/EIPTypes";
export type { EvmSignedResult } from "./model/EvmSignedResult";
export {
  type GetAddressDAState,
  isGetAddressResult,
} from "./model/GetAddress";
export {
  isSignPersonalMessageParams,
  type SignPersonalMessageParams,
} from "./model/SignPersonalMessageParams";
export {
  isSignRawTransactionParams,
  type SignRawTransactionParams,
} from "./model/SignRawTransactionParams";
export {
  isSignTransactionParams,
  type SignTransactionParams,
  type Transaction,
} from "./model/SignTransactionParams";
export {
  isSignTypedMessageParams,
  type SignTypedMessageParams,
} from "./model/SignTypedMessageParams";
export { isBlockingRequestMethod } from "./utils/isBlockingRequestMethod";

/**
 * Factory that creates an EVM {@link BlockchainProvider}. Register with
 * `blockchainProviderFactories` on {@link LedgerButtonCore} options.
 */
export const createEvmBlockchainProvider: BlockchainProviderFactory = (
  core: CoreFacade,
  config: BlockchainConfig,
): BlockchainProvider => new EvmBlockchainProvider(core, config);

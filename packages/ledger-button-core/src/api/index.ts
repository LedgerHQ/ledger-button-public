export type { WalletActionType } from "../internal/backend/model/trackEvent.js";
export type { Device } from "../internal/device/model/Device.js";
export type { ConnectionType } from "../internal/device/service/DeviceManagementKitService.js";
export { LedgerEIP1193Provider } from "../internal/evm-provider/LedgerEIP1193Provider.js";
// Load-bearing: re-exporting this pulls the family's `SignedResultRegistry`
// augmentation into cross-package consumers so `SignedResults` resolves to the
// EVM union instead of `never`. Keep one such re-export per family.
export type { EvmSignedResult } from "../internal/evm-provider/model/EvmSignedResult.js";
export { isBlockingRequestMethod } from "../internal/evm-provider/utils/isBlockingRequestMethod.js";
export type { SolanaSignedResult } from "../internal/solana-provider/model/SolanaSignedResult.js";
export type { BlockchainProvider } from "./blockchain-provider/model/BlockchainProvider.js";
export type { CoreFacade } from "./blockchain-provider/model/CoreFacade.js";
export type { CurrencyNetworkRef } from "./blockchain-provider/model/CurrencyNetworkRef.js";
export type {
  BlockchainFamily,
  ProviderBlockchain,
  ProviderDeviceSession,
  ProviderSdkConfig,
  ProviderSignParams,
  SelectAccountIntentParams,
  SelectAccountNavigationIntent,
  SignIntentParams,
  SignNavigationIntent,
  WalletNavigationIntent,
  WalletProvider,
} from "./blockchain-provider/model/types.js";
export * from "./errors/index.js";
export * from "./LedgerButtonCore.js";
export type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "./model/blockchain/GasFee.js";
export type { ProviderAccount } from "./model/blockchain/ProviderAccount.js";
export type {
  ProviderLogData,
  ProviderLogger,
} from "./model/blockchain/ProviderLogger.js";
export type {
  BlockchainAppDependencies,
  BlockchainAppDependency,
  BlockchainConfig,
  BlockchainNetwork,
  BlockchainRpcMethods,
} from "./model/dappConfig/BlockchainConfig.js";
export * from "./model/index.js";
export * from "./utils/index.js";
export { type DiscoveredDevice } from "@ledgerhq/device-management-kit";

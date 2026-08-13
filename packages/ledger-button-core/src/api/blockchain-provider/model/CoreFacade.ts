import type { TypedData } from "@ledgerhq/device-signer-kit-ethereum";

import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "@api/model/blockchain/GasFee.js";
import type { ProviderAccount } from "@api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "@api/model/blockchain/ProviderLogger.js";
import type { SignedResults } from "@api/model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus.js";
import type {
  BroadcastResponse,
  JSONRPCRequest,
} from "@internal/backend/types.js";

import type {
  BlockchainFamily,
  ProviderBlockchain,
  ProviderDeviceSession,
  ProviderSdkConfig,
  ProviderSignParams,
  WalletNavigationIntent,
} from "./types.js";

/**
 * Outbound port the provider CALLS (provider -> core). It is the single set of
 * core capabilities a blockchain provider module depends on; everything else in
 * core stays private to keep the module a candidate for package extraction.
 */
export interface CoreFacade {
  /**
   * Backend-backed JSON-RPC transport to the node: reads (`eth_getBalance`,
   * `eth_call`, gas, nonce, ...) AND broadcasting a signed raw tx. The provider
   * supplies the target {@link ProviderBlockchain}; core forwards the call to
   * the backend and never interprets the method.
   */
  broadcastRPC(
    args: JSONRPCRequest,
    blockchain: ProviderBlockchain,
  ): Promise<BroadcastResponse>;
  requestAccount(family: BlockchainFamily): Promise<ProviderAccount>;
  requestSwitchChain(chainId: number): Promise<void>;
  /**
   * Disconnect the calling provider's blockchain `family`: core drops that
   * family's selected account and only tears the whole session down once no
   * selected account remains.
   */
  disconnect(family: BlockchainFamily): Promise<void>;

  /** Scoped logger; `tag` prefixes the provider's log lines. */
  getLogger(tag: string): ProviderLogger;
  /** Shared DMK handle + current device session (core owns connection). */
  getDeviceSession(): ProviderDeviceSession;
  /** Origin token + dApp identifier needed to build the signer/context. */
  getSdkConfig(): ProviderSdkConfig;
  /** Whether the in-flow modal is currently open (broadcast gate). */
  isModalOpen(): boolean;

  trackTransactionStarted(): void;
  trackTransactionCompleted(
    rawTransaction: string,
    result: SignedResults,
  ): void;
  trackTypedMessageStarted(typedData: TypedData): void;
  trackTypedMessageCompleted(typedData: TypedData): void;

  /**
   * Gas-fee estimation via the coin-service, when the chain is supported.
   * Returns `undefined` so the provider can fall back to RPC estimation.
   */
  estimateGasFromCoinService(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation | undefined>;

  /** Emit a UI navigation intent for the current sign / selection phase. */
  emitNavigationIntent(intent: WalletNavigationIntent): void;
  /** Forward a sign-flow status so core can track a broadcasted transaction. */
  trackBroadcastedTransaction(
    status: SignFlowStatus,
    params: ProviderSignParams,
  ): void;
}

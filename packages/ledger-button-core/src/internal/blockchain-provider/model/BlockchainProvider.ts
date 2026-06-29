import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { TypedData } from "@ledgerhq/device-signer-kit-ethereum";
import type { Observable } from "rxjs";

import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "../../../api/model/blockchain/GasFee.js";
import type { ProviderAccount } from "../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../api/model/blockchain/ProviderLogger.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import type {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../api/model/eip/EIPTypes.js";
import type { SignedResults } from "../../../api/model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { SignPersonalMessageParams } from "../../../api/model/signing/SignPersonalMessageParams.js";
import type { SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import type { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import type { SignTypedMessageParams } from "../../../api/model/signing/SignTypedMessageParams.js";

/**
 * Blockchain family supported by the wallet provider layer.
 *
 * Used by the manager to dispatch to the right provider implementation based on
 * the selected account / currency.
 */
export type BlockchainFamily = "evm" | "solana";

/**
 * Public, blackbox surface of a wallet provider.
 *
 * Everything the dApp-facing world needs: the {@link BlockchainFamily} it
 * serves and a single `init()` that performs discovery wiring (EIP-6963
 * announce for EVM, `registerWallet` for Solana) and returns a teardown.
 *
 * The provider talks to core only through {@link CoreFacade}; it never
 * imports `LedgerButtonCore`, which keeps `blockchain-provider` a candidate for
 * extraction into its own package.
 */
export interface WalletProvider {
  readonly family: BlockchainFamily;
  /** Announce / register the provider and wire listeners; returns teardown. */
  init(): () => void;
}

export type { SignedResults };

/**
 * Target blockchain a provider attaches to a backend JSON-RPC call. The
 * provider owns this identity (it knows its own chain); core only forwards it
 * to the backend without interpreting it.
 */
export type ProviderBlockchain = {
  name: string;
  chainId: string;
};

/**
 * Device handle core exposes to a provider module. `dmk` is the shared
 * {@link DeviceManagementKit} peer dependency (core owns the connection);
 * `sessionId` / `isConnected` reflect the currently connected device.
 */
export type ProviderDeviceSession = {
  dmk: DeviceManagementKit;
  sessionId?: string;
  isConnected: boolean;
};

/**
 * Minimal SDK config a provider needs to build its signer / context module.
 */
export type ProviderSdkConfig = {
  originToken: string;
  dAppIdentifier: string;
};

/** Sign-flow params a provider forwards to core for pending-tx tracking. */
export type ProviderSignParams =
  | SignTransactionParams
  | SignRawTransactionParams
  | SignTypedMessageParams
  | SignPersonalMessageParams;

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
  ): Promise<JsonRpcResponse>;
  requestAccount(family: BlockchainFamily): Promise<ProviderAccount>;
  requestSwitchChain(chainId: number): Promise<void>;
  disconnect(): Promise<void>;

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
}

/**
 * Core -> UI navigation intent emitted while core runs an account-selection or
 * sign phase. The button package maps `name` to its own navigation; the
 * `status$` / `finish` / `retry` machinery lives here, not on the provider
 * boundary.
 */
export interface WalletNavigationIntent {
  /** e.g. "selectAccount" | "signTransaction" - mapped to nav by the button. */
  name: string;
  params?: unknown;
  /** UI subscribes for live progress (like today's SignFlowStatus). */
  status$: Observable<SignFlowStatus>;
  /** UI acknowledges success -> core resolves the host promise. */
  finish: () => void;
  /** UI asks core to re-run the phase after an error. */
  retry: () => void;
}

import type { Observable } from "rxjs";

import type {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../api/model/eip/EIPTypes.js";
import type { SignedResults } from "../../../api/model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { Account } from "../../account/service/AccountService.js";

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
 * Outbound port the provider CALLS (provider -> core). Every method is async:
 * the provider triggers a phase and awaits the result while core owns the UI
 * and device machinery.
 */
export interface CoreFacade {
  /**
   * Backend-backed JSON-RPC transport to the node: reads (`eth_getBalance`,
   * `eth_call`, gas, nonce, ...) AND broadcasting a signed raw tx. Core fills
   * `blockchain` / `chainId` from context; it never interprets the method.
   */
  broadcastRPC(args: JSONRPCRequest): Promise<JsonRpcResponse>;
  requestAccount(family: BlockchainFamily): Promise<Account>;
  requestSwitchChain(chainId: number): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Entry point for a concrete blockchain family implementation (EVM, Solana, …).
 *
 * Wired once by {@link DefaultBlockchainProviderManager}; core then pushes
 * selected account / network through the context methods.
 */
export interface BlockchainProvider {
  readonly family: BlockchainFamily;
  /**
   * Wire the provider with the core host and dApp config and announce it to
   * the dApp (EIP-6963 / Wallet Standard).
   *
   * Called once by {@link DefaultBlockchainProviderManager} after the dApp
   * config has been fetched.
   */
  injectWalletProviders(): void;
  setSelectedAccount(account: Account | undefined): void;
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

/**
 * Neutral, provider-facing subset of the dApp config. Mirrors the internal
 * `DAppConfigV2Blockchain` but with no core import so the package stays
 * self-contained.
 */
export type ProviderNetwork = {
  id: string;
  currencyId: string;
  currencyName: string;
  currencyTicker: string;
};

export type ProviderRpcMethods = {
  local: string[];
  broadcasted: string[];
};

export type ProviderDAppConfig = {
  blockchain: string;
  appName: string;
  networks: ProviderNetwork[];
  rpcMethods?: ProviderRpcMethods;
};

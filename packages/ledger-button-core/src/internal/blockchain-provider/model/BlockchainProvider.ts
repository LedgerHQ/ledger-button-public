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
 * The provider talks to core only through {@link WalletProviderHost}; it never
 * imports `LedgerButtonCore`, which keeps `blockchain-provider` a candidate for
 * extraction into its own package.
 */
export interface WalletProvider {
  readonly family: BlockchainFamily;
  /** Announce / register the provider and wire listeners; returns teardown. */
  init(): () => void;
}

/**
 * Discriminated sign request mirroring the existing EVM signing flows.
 *
 * The provider builds it and hands it to {@link WalletProviderHost.requestSign};
 * core interprets the `kind` to run the matching signing use case.
 */
export type WalletProviderSignRequest =
  | {
      kind: "transaction";
      transaction: Record<string, unknown> | string;
      method: string;
      broadcast: boolean;
    }
  | {
      kind: "typedData";
      payload: [address: string, typedData: unknown, method: string];
    }
  | {
      kind: "personalMessage";
      payload: [address: string, message: string, method: string];
    };

export type { SignedResults };

/**
 * Outbound port the provider CALLS (provider -> core). Every method is async:
 * the provider triggers a phase and awaits the result while core owns the UI
 * and device machinery.
 */
export interface WalletProviderHost {
  /**
   * Backend-backed JSON-RPC transport to the node: reads (`eth_getBalance`,
   * `eth_call`, gas, nonce, ...) AND broadcasting a signed raw tx. Core fills
   * `blockchain` / `chainId` from context; it never interprets the method.
   */
  broadcastRPC(args: JSONRPCRequest): Promise<JsonRpcResponse>;
  /** Trigger the account-selection phase; the UI is run entirely by core. */
  requestAccount(family: BlockchainFamily): Promise<Account>;
  /** Trigger the signing phase; the UI + device flow are run entirely by core. */
  requestSign(request: WalletProviderSignRequest): Promise<SignedResults>;
  /** Provider-initiated chain switch (replaces the public `core.setChainId`). */
  requestSwitchChain(chainId: number): Promise<void>;
  /** Provider-initiated disconnect (replaces a direct `core.disconnect()`). */
  disconnect(): Promise<void>;
}

/**
 * Inbound surface core CALLS on a concrete provider to push context. NOT part
 * of the public {@link WalletProvider} blackbox.
 */
export interface CoreFacingWalletProvider extends WalletProvider {
  /** Core pushes the freshly selected account (or `undefined` on disconnect). */
  setSelectedAccount(account: Account | undefined): void;
  /** Core pushes the active chain id. */
  setNetwork(chainId: number): void;
}

/**
 * Core -> UI navigation intent emitted while core runs `requestAccount` /
 * `requestSign`. The button package maps `name` to its own navigation; the
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

/**
 * Inversify factory keyed by family; resolves the per-family blockchain entry
 * of the dApp config. The config is fetched async and re-fetched after a
 * `disconnect()` recreates the container, so it is a factory rather than a
 * static value.
 */
export type ProviderDAppConfigFactory = (
  family: BlockchainFamily,
) => Promise<ProviderDAppConfig | undefined>;

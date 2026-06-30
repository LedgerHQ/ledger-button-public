import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";

import type { SignedResults } from "../../model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "../../model/signing/SignFlowStatus.js";
import type { SignPersonalMessageParams } from "../../model/signing/SignPersonalMessageParams.js";
import type { SignRawTransactionParams } from "../../model/signing/SignRawTransactionParams.js";
import type { SignTransactionParams } from "../../model/signing/SignTransactionParams.js";
import type { SignTypedMessageParams } from "../../model/signing/SignTypedMessageParams.js";

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

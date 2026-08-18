import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";

import type { SignedResults } from "@api/model/signing/SignedTransaction";
import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus";
import type { SignIntentType } from "@api/model/signing/SignIntentType";
import type { SignPersonalMessageParams } from "@api/model/signing/SignPersonalMessageParams";
import type { SignRawTransactionParams } from "@api/model/signing/SignRawTransactionParams";
import type { SignTransactionParams } from "@api/model/signing/SignTransactionParams";
import type { SignTypedMessageParams } from "@api/model/signing/SignTypedMessageParams";
import type { SignSolanaMessageParams } from "@api/model/signing/solana/SignSolanaMessageParams";
import type { SignSolanaTransactionParams } from "@api/model/signing/solana/SignSolanaTransactionParams";

/**
 * Blockchain family supported by the wallet provider layer.
 *
 * Used by the manager to dispatch to the right provider implementation based on
 * the selected account / currency.
 */
export type BlockchainFamily = "ethereum" | "solana";

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
  | SignPersonalMessageParams
  | SignSolanaMessageParams
  | SignSolanaTransactionParams;

/**
 * Payload carried by the `selectAccount` {@link WalletNavigationIntent} when the
 * selection is triggered by a dApp request. The UI uses `family` to only list
 * accounts compatible with the requesting blockchain (EVM vs Solana). Absent
 * when selection is opened manually (floating button), in which case the UI
 * shows every account.
 */
export type SelectAccountIntentParams = {
  family: BlockchainFamily;
};

/**
 * Payload carried by the `signTransaction` {@link WalletNavigationIntent}.
 *
 * Deliberately a small set of decisions rather than the raw
 * {@link ProviderSignParams}: everything here is something the provider already
 * knows when it emits the intent, and the UI would otherwise have to re-derive
 * it by narrowing an `unknown` payload through the sign-params type guards.
 *
 * The raw payload is not carried: pending-transaction tracking receives it
 * directly through {@link CoreFacade.trackBroadcastedTransaction}, on a path
 * that does not go through the UI.
 */
export type SignIntentParams = {
  family: BlockchainFamily;
  /** What the user is approving - drives the success copy. */
  type: SignIntentType;
  /** Whether core broadcasts the transaction once signed. */
  broadcast: boolean;
};

type WalletNavigationIntentBase = {
  /** UI subscribes for live progress (like today's SignFlowStatus). */
  status$: Observable<SignFlowStatus>;
  /** UI acknowledges success -> core resolves the host promise. */
  finish: () => void;
  /** UI asks core to re-run the phase after an error. */
  retry: () => void;
};

export type SelectAccountNavigationIntent = WalletNavigationIntentBase & {
  name: "selectAccount";
  params: SelectAccountIntentParams;
};

export type SignNavigationIntent = WalletNavigationIntentBase & {
  name: "signTransaction";
  params: SignIntentParams;
};

/**
 * Core -> UI navigation intent emitted while core runs an account-selection or
 * sign phase. The button package maps `name` to its own navigation; the
 * `status$` / `finish` / `retry` machinery lives here, not on the provider
 * boundary.
 *
 * Discriminated on `name` so the UI reads `params` without casting.
 */
export type WalletNavigationIntent =
  | SelectAccountNavigationIntent
  | SignNavigationIntent;

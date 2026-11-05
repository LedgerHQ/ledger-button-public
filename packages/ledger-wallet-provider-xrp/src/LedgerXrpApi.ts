import type {
  SignedXrpTransaction,
  XrpTransaction,
} from "./model/XrpTransaction";
import type { XRP_FAMILY } from "./utils/xrpUtils";

export type XrpAccountInfo = {
  readonly address: string;
  /** Only known once read from the device, so absent until a transaction is signed. */
  readonly publicKey?: string;
  /** XRPL `network_id` of the account (`"0"` mainnet, `"1"` testnet). */
  readonly network: string;
};

export type XrpConnectOptions = {
  /**
   * Never opens account selection: resolves the selected account, or rejects
   * with `NOT_CONNECTED`. Used by auto-reconnect.
   */
  readonly silent?: boolean;
};

export type XrpApiEvent = "connect" | "disconnect" | "accountChanged" | "error";

export type XrpApiListener = (data: unknown) => void;

/**
 * Minimal, wallet-agnostic XRPL provider surface (the "no standard" workaround).
 * It is the runtime subset of the xrpl-connect `WalletAdapter` interface.
 * Shape is inspired by what xrpl-connect adapters need, NOT by a ratified standard.
 */
export interface LedgerXrpApi {
  readonly family: typeof XRP_FAMILY;
  /**
   * Resolves the selected account, or opens account selection when none is
   * selected (unless `silent`). Emits `connect`.
   */
  connect(options?: XrpConnectOptions): Promise<XrpAccountInfo>;
  /** Clears local state and emits `disconnect`. */
  disconnect(): Promise<void>;
  /** The account selected in Ledger Button, from memory. Never opens the modal. */
  getAccount(): Promise<XrpAccountInfo | null>;
  /** Same value as `getAccount()`: Core pushes every account change, so there is nothing to fetch. */
  fetchAccount(): Promise<XrpAccountInfo | null>;
  /**
   * Signs on the device and returns the signed blob (hex), its transaction ID
   * and the `TxnSignature`. A missing `Sequence`, `Fee` or
   * `LastLedgerSequence` is filled from the network first; rejects with
   * `AUTOFILL_FAILED` when it cannot be read.
   */
  sign(tx: XrpTransaction): Promise<SignedXrpTransaction>;
  /** Same autofill as `sign`, then submits; rejects with `SUBMIT_FAILED` unless the node takes it. */
  signAndSubmit(tx: XrpTransaction): Promise<{ hash: string }>;
  on(event: XrpApiEvent, listener: XrpApiListener): void;
  off(event: XrpApiEvent, listener: XrpApiListener): void;
}

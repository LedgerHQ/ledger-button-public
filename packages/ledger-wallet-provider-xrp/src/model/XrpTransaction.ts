/**
 * An XRPL transaction as plain JSON (rippled's `tx_json`). The common fields the
 * provider reads or fills are typed; the type-specific ones (`Destination`,
 * `Amount`, `Memos`, …) are passed through untouched.
 */
export type XrpTransaction = {
  TransactionType: string;
  Account?: string;
  /** Drops, as a string. */
  Fee?: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  TicketSequence?: number;
  Flags?: number;
  SigningPubKey?: string;
  [field: string]: unknown;
};

export type SignedXrpTransaction = {
  readonly tx_blob: string;
  readonly hash: string;
  readonly signature: string;
};

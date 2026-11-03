const MEMO_TYPE = "message";
const MEMO_FORMAT = "text/plain";

// Ledger 1 is long closed, so the network can never include this transaction.
const EXPIRED_LAST_LEDGER_SEQUENCE = 1;

function utf8ToHex(value: string): string {
  return Array.from(new TextEncoder().encode(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * XRPL has no message-signing primitive, and the XRP app only signs
 * transactions. This fake "signed message" is a transaction that carries the
 * message in a Memo and can never be validated: `Sequence` 0 (no ticket) and an
 * already expired `LastLedgerSequence`. Submitting it is harmless.
 *
 * It lives in the test dApp only: the provider does not support `signMessage`.
 */
export function buildMessageProofTransaction(
  message: string,
): Record<string, unknown> {
  return {
    TransactionType: "AccountSet",
    Sequence: 0,
    Fee: "0",
    LastLedgerSequence: EXPIRED_LAST_LEDGER_SEQUENCE,
    Memos: [
      {
        Memo: {
          MemoType: utf8ToHex(MEMO_TYPE).toUpperCase(),
          MemoFormat: utf8ToHex(MEMO_FORMAT).toUpperCase(),
          MemoData: utf8ToHex(message).toUpperCase(),
        },
      },
    ],
  };
}

import type { XrpTransaction } from "@ledgerhq/ledger-wallet-provider-xrp";

export type PaymentValues = {
  destination: string;
  amountDrops: string;
};

/**
 * A bare Payment: the provider fills `Sequence`, `Fee` and
 * `LastLedgerSequence` through the button backend before signing.
 */
export function buildPayment({
  destination,
  amountDrops,
}: PaymentValues): XrpTransaction {
  return {
    TransactionType: "Payment",
    Destination: destination,
    Amount: amountDrops,
  };
}

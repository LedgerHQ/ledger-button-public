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
}: PaymentValues): Record<string, unknown> {
  return {
    TransactionType: "Payment",
    Destination: destination,
    Amount: amountDrops,
  };
}

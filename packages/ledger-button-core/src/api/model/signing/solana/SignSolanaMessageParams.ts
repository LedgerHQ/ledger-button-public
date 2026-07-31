/**
 * Parameters for the Solana off-chain message signing flow (`solana:signMessage`).
 *
 * Unlike the EVM signing params (positional tuples), this is a tagged object so
 * it can be reliably discriminated from the array-based EVM params in the
 * `TransactionService` routing switch.
 */
export type SignSolanaMessageParams = {
  kind: "solana-message";
  address: string;
  message: Uint8Array;
};

export function isSignSolanaMessageParams(
  params: unknown,
): params is SignSolanaMessageParams {
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return false;
  }

  const candidate = params as Partial<SignSolanaMessageParams>;

  return (
    candidate.kind === "solana-message" &&
    typeof candidate.address === "string" &&
    candidate.message instanceof Uint8Array
  );
}

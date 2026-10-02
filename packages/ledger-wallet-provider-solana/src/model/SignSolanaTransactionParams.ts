/**
 * Parameters for the Solana transaction signing flow (`solana:signTransaction`).
 *
 * Tagged object mirroring {@link SignSolanaMessageParams} so it can be
 * discriminated from the Solana message params.
 */
export type SignSolanaTransactionParams = {
  kind: "solana-transaction";
  address: string;
  transaction: Uint8Array;
};

export function isSignSolanaTransactionParams(
  params: unknown,
): params is SignSolanaTransactionParams {
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return false;
  }

  const candidate = params as Partial<SignSolanaTransactionParams>;

  return (
    candidate.kind === "solana-transaction" &&
    typeof candidate.address === "string" &&
    candidate.transaction instanceof Uint8Array
  );
}

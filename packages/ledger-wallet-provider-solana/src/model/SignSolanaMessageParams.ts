/**
 * Parameters for the Solana off-chain message signing flow (`solana:signMessage`).
 *
 * Tagged object so it can be discriminated from the Solana transaction params.
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

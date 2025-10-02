export interface SignRawTransactionParams {
  transaction: string;
  broadcast: boolean;
}

export function isSignRawTransactionParams(
  params: unknown,
): params is SignRawTransactionParams {
  return (
    !!params &&
    params !== null &&
    typeof params === "object" &&
    "transaction" in params &&
    typeof params.transaction === "string"
  );
}

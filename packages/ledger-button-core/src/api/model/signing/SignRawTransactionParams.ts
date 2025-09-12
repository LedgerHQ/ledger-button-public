export interface SignRawTransactionParams {
  rawTransaction: string;
  broadcast: boolean;
}

export function isSignRawTransactionParams(
  params: unknown,
): params is SignRawTransactionParams {
  return (
    !!params &&
    typeof params === "object" &&
    params !== null &&
    "rawTransaction" in params
  );
}

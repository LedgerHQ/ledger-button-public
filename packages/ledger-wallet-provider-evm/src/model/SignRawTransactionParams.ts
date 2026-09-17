export type SignRawTransactionParams = {
  transaction: string;
  method: string;
  broadcast: boolean;
};

export function isSignRawTransactionParams(
  params: unknown,
): params is SignRawTransactionParams {
  return (
    !!params &&
    params !== null &&
    typeof params === "object" &&
    "transaction" in params &&
    typeof params.transaction === "string" &&
    "method" in params &&
    typeof params.method === "string" &&
    (params.method === "eth_sendRawTransaction" ||
      params.method === "eth_signRawTransaction")
  );
}

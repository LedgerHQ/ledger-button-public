import { type TypedData } from "@ledgerhq/device-signer-kit-ethereum";
export type SignTypedMessageParams = [string, TypedData];

export function isSignTypedMessageParams(
  params: unknown,
): params is SignTypedMessageParams {
  return (
    !!params &&
    Array.isArray(params) &&
    params.length === 3 &&
    typeof params[0] === "string" &&
    typeof params[1] === "object" &&
    "types" in params[1] &&
    "primaryType" in params[1] &&
    "domain" in params[1] &&
    "message" in params[1] &&
    typeof params[2] === "string" &&
    (params[2] === "eth_signTypedData" || params[2] === "eth_signTypedData_v4")
  );
}

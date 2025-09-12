import { type TypedData } from "@ledgerhq/device-signer-kit-ethereum";
export type SignTypedMessageParams = [string, TypedData];

export function isSignTypedMessageParams(
  params: unknown,
): params is SignTypedMessageParams {
  return (
    !!params &&
    Array.isArray(params) &&
    params.length === 2 &&
    typeof params[0] === "string" &&
    typeof params[1] === "object" &&
    "types" in params[1] &&
    "primaryType" in params[1] &&
    "domain" in params[1] &&
    "message" in params[1]
  );
}

export type SignPersonalMessageParams = [string, string | Uint8Array];

export function isSignPersonalMessageParams(
  params: unknown,
): params is SignPersonalMessageParams {
  return (
    !!params &&
    Array.isArray(params) &&
    params.length === 2 &&
    typeof params[0] === "string" &&
    (typeof params[1] === "string" || params[1] instanceof Uint8Array)
  );
}

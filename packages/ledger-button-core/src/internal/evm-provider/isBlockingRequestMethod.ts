/**
 * RPC methods that block the provider until the user has resolved the
 * preceding interaction (e.g. account selection, signing).
 *
 * Pure provider-UX logic — intentionally NOT data-driven via dAppConfig
 * (that lives in {@link ./supportedRpcMethods.js} for the `local` /
 * `broadcasted` routing decision).
 */
const BLOCKING_REQUEST_METHODS: ReadonlyArray<string> = [
  "eth_requestAccounts",
  "eth_accounts",
  "eth_signTypedData_v4",
  "personal_sign",
  "eth_sign",
  "eth_signTransaction",
  "eth_signRawTransaction",
  "eth_sendTransaction",
  "eth_sendRawTransaction",
];

export function isBlockingRequestMethod(method: string): boolean {
  return BLOCKING_REQUEST_METHODS.includes(method);
}

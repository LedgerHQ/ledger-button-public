import type { ProviderRpcMethods } from "../../../blockchain-provider/model/BlockchainProvider.js";
import {
  BROADCASTED_TO_NODE_RPC_METHODS,
  LOCALLY_HANDLED_RPC_METHODS,
} from "./supportedRpcMethods.js";

export type RpcRoute = "local" | "broadcasted" | "unsupported";

const STATIC_LOCAL: ReadonlySet<string> = new Set(LOCALLY_HANDLED_RPC_METHODS);
const STATIC_BROADCASTED: ReadonlySet<string> = new Set(
  BROADCASTED_TO_NODE_RPC_METHODS,
);

/**
 * Decide how an RPC method should be routed.
 *
 * The static {@link LOCALLY_HANDLED_RPC_METHODS} / {@link BROADCASTED_TO_NODE_RPC_METHODS}
 * lists are the safe baseline. When a per-dApp {@link ProviderRpcMethods} config
 * is available it *augments* that baseline:
 *
 * - `config.broadcasted` takes precedence and can force a normally-local method
 *   to be forwarded to the node RPC.
 * - `config.local` / `config.broadcasted` can add methods that the static lists
 *   don't know about.
 *
 * Config is intentionally additive (never narrowing): partner configs are
 * typically partial, so dropping the baseline would break standard methods such
 * as `eth_accounts` or `eth_getBalance`.
 */
export function resolveRpcRoute(
  method: string,
  rpcMethods?: ProviderRpcMethods,
): RpcRoute {
  const configLocal = rpcMethods?.local ?? [];
  const configBroadcasted = rpcMethods?.broadcasted ?? [];

  if (configBroadcasted.includes(method)) {
    return "broadcasted";
  }

  if (STATIC_LOCAL.has(method) || configLocal.includes(method)) {
    return "local";
  }

  if (STATIC_BROADCASTED.has(method)) {
    return "broadcasted";
  }

  return "unsupported";
}

import type { SolanaJSONRPCRequest } from "@ledgerhq/ledger-wallet-provider-core";
import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponseSuccess,
} from "@ledgerhq/ledger-wallet-provider-core";
import { getBase58Encoder } from "@solana/kit";

const base58Encoder = getBase58Encoder();

/**
 * Optional Wallet Standard `solana:signAndSendTransaction` options, forwarded to
 * the node's `sendTransaction` RPC config object.
 *
 * @see https://solana.com/docs/rpc/http/sendtransaction
 */
export type SolanaSendOptions = {
  commitment?: string;
  skipPreflight?: boolean;
  maxRetries?: number;
  minContextSlot?: number;
  preflightCommitment?: string;
};

export function buildSendTransactionRequest(
  id: number,
  base64WireTx: string,
  options?: SolanaSendOptions,
): SolanaJSONRPCRequest {
  return {
    jsonrpc: "2.0",
    id,
    method: "sendTransaction",
    params: [base64WireTx, { encoding: "base64", ...options }],
  };
}

/**
 * The backend answers either with the coin-service envelope or with a raw
 * JSON-RPC response; `undefined` means the broadcast did not succeed.
 */
export function extractBroadcastedSignature(
  response: BroadcastResponse,
): string | undefined {
  if (isCoinServiceBroadcastResponse(response)) {
    return response.transactionIdentifier;
  }

  if (isJsonRpcResponseSuccess(response)) {
    return response.result as string;
  }

  return undefined;
}

/** The Wallet Standard expects the 64 raw bytes, not the base58 string. */
export function decodeSolanaSignature(signature: string): Uint8Array {
  return new Uint8Array(base58Encoder.encode(signature));
}

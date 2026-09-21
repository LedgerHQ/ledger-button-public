import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponseSuccess,
} from "@ledgerhq/ledger-wallet-provider-core";
import { getBase58Encoder } from "@solana/kit";

import type { SolanaJSONRPCRequest } from "../../model/SolanaTypes";

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
 * JSON-RPC envelope for the blockhash refresh used during delayed signing.
 *
 * @see https://solana.com/docs/rpc/http/getlatestblockhash
 */
export function buildGetLatestBlockhashRequest(id: number): SolanaJSONRPCRequest {
  return {
    jsonrpc: "2.0",
    id,
    method: "getLatestBlockhash",
    params: [{ commitment: "finalized" }],
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

const SOLANA_BLOCKHASH_LENGTH = 32;

/**
 * Reads the 32-byte latest blockhash from a JSON-RPC `getLatestBlockhash`
 * success payload. `undefined` means the response cannot be used for delayed
 * signing (error, unexpected shape, or wrong length).
 */
export function extractLatestBlockhash(
  response: BroadcastResponse,
): Uint8Array | undefined {
  if (!isJsonRpcResponseSuccess(response)) {
    return undefined;
  }

  const result = response.result;
  if (typeof result !== "object" || result === null) {
    return undefined;
  }

  const value = "value" in result ? result.value : undefined;
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const blockhash =
    "blockhash" in value && typeof value.blockhash === "string"
      ? value.blockhash
      : undefined;
  if (!blockhash) {
    return undefined;
  }

  const bytes = new Uint8Array(base58Encoder.encode(blockhash));
  if (bytes.byteLength !== SOLANA_BLOCKHASH_LENGTH) {
    return undefined;
  }
  return bytes;
}

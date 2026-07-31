import { getBase64Decoder, getBase64Encoder } from "@solana/kit";

/**
 * Minimal client for Jupiter's Ultra API.
 *
 * The Ultra API crafts AND broadcasts the swap transaction, so the dApp only
 * has to sign the serialized transaction it returns. This is ideal for testing
 * the Ledger `solana:signTransaction` feature (and, later, clear signing) with
 * real, human-readable swaps.
 *
 * Ultra is mainnet-only: there is no routing/liquidity on devnet or testnet.
 *
 * @see https://dev.jup.ag/docs/ultra-api/
 */

const ULTRA_API_BASE_URL = "https://lite-api.jup.ag/ultra/v1";

export interface JupiterToken {
  symbol: string;
  mint: string;
  decimals: number;
}

export const JUPITER_TOKENS: JupiterToken[] = [
  {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  {
    symbol: "JUP",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
  },
  {
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
  },
];

export function getJupiterTokenByMint(mint: string): JupiterToken | undefined {
  return JUPITER_TOKENS.find((token) => token.mint === mint);
}

export interface JupiterSwapValues {
  inputMint: string;
  outputMint: string;
  /** Amount in the base units of the input mint (e.g. lamports for SOL). */
  amount: number;
}

export interface JupiterUltraOrder {
  /** Base64-encoded, unsigned VersionedTransaction (null when no route). */
  transaction: string | null;
  requestId: string;
  inAmount?: string;
  outAmount?: string;
  swapType?: string;
  errorMessage?: string;
}

export interface JupiterUltraExecuteResult {
  status: string;
  signature?: string;
  error?: string;
  code?: number;
}

export interface GetJupiterUltraOrderParams extends JupiterSwapValues {
  /** Base58 public key of the account performing (and paying for) the swap. */
  taker: string;
}

export async function getJupiterUltraOrder({
  inputMint,
  outputMint,
  amount,
  taker,
}: GetJupiterUltraOrderParams): Promise<JupiterUltraOrder> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    taker,
  });

  const response = await fetch(
    `${ULTRA_API_BASE_URL}/order?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(
      `Jupiter order request failed (${response.status}): ${await response.text()}`,
    );
  }

  const order = (await response.json()) as JupiterUltraOrder;
  if (!order.transaction) {
    throw new Error(
      order.errorMessage ?? "Jupiter returned no route for this pair.",
    );
  }
  return order;
}

export interface ExecuteJupiterUltraOrderParams {
  /** Base64-encoded signed VersionedTransaction. */
  signedTransaction: string;
  requestId: string;
}

export async function executeJupiterUltraOrder({
  signedTransaction,
  requestId,
}: ExecuteJupiterUltraOrderParams): Promise<JupiterUltraExecuteResult> {
  const response = await fetch(`${ULTRA_API_BASE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransaction, requestId }),
  });

  if (!response.ok) {
    throw new Error(
      `Jupiter execute request failed (${response.status}): ${await response.text()}`,
    );
  }

  return (await response.json()) as JupiterUltraExecuteResult;
}

/** Decode a base64 string (Jupiter's serialized transaction) into raw bytes. */
export function base64ToBytes(value: string): Uint8Array {
  return new Uint8Array(getBase64Encoder().encode(value));
}

/** Encode raw transaction bytes back into a base64 string for Jupiter execute. */
export function bytesToBase64(value: Uint8Array): string {
  return getBase64Decoder().decode(value);
}

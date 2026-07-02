import { ethers, type TransactionLike } from "ethers";

const ETHERSCAN_V2_API_URL = "https://api.etherscan.io/v2/api";
const MAINNET_CHAIN_ID = 1;

const SIGNABLE_TX_TYPES = new Set([0, 1, 2]);

interface EtherscanRpcTransaction {
  hash: string;
  type: string;
  nonce: string;
  to: string | null;
  value: string;
  input: string;
  gas: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId?: string;
  accessList?: TransactionLike["accessList"];
}

interface EtherscanRpcResponse {
  jsonrpc?: string;
  id?: number;
  result?: { transactions?: EtherscanRpcTransaction[] } | null;
  status?: string;
  message?: string;
}

/**
 * Fetches the latest mainnet block from the Etherscan V2 API, picks a random
 * signable transaction (type 0/1/2 with a recipient) and rebuilds its unsigned
 * RLP serialization so it can be replayed through `eth_signRawTransaction`.
 */
export async function fetchRandomUnsignedRawTx(): Promise<{
  rawTx: string;
  hash: string;
}> {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_ETHERSCAN_API_KEY. Add it to your .env to fetch transactions.",
    );
  }

  const url = new URL(ETHERSCAN_V2_API_URL);
  url.searchParams.set("chainid", String(MAINNET_CHAIN_ID));
  url.searchParams.set("module", "proxy");
  url.searchParams.set("action", "eth_getBlockByNumber");
  url.searchParams.set("tag", "latest");
  url.searchParams.set("boolean", "true");
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Etherscan request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EtherscanRpcResponse;
  const transactions = data.result?.transactions;
  if (!transactions) {
    throw new Error(
      `Etherscan returned no transactions${data.message ? `: ${data.message}` : ""}`,
    );
  }

  const signableTransactions = transactions.filter(
    (tx) => tx.to != null && SIGNABLE_TX_TYPES.has(parseInt(tx.type, 16)),
  );
  if (signableTransactions.length === 0) {
    throw new Error("No signable transaction found in the latest block");
  }

  const tx =
    signableTransactions[
      Math.floor(Math.random() * signableTransactions.length)
    ];

  return { rawTx: rebuildUnsignedRawTx(tx), hash: tx.hash };
}

function rebuildUnsignedRawTx(tx: EtherscanRpcTransaction): string {
  const type = parseInt(tx.type, 16);

  const transaction: TransactionLike = {
    type,
    chainId: tx.chainId ? parseInt(tx.chainId, 16) : MAINNET_CHAIN_ID,
    nonce: parseInt(tx.nonce, 16),
    to: tx.to,
    value: BigInt(tx.value),
    data: tx.input,
    gasLimit: BigInt(tx.gas),
  };

  if (type === 2) {
    transaction.maxFeePerGas = tx.maxFeePerGas
      ? BigInt(tx.maxFeePerGas)
      : undefined;
    transaction.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
      ? BigInt(tx.maxPriorityFeePerGas)
      : undefined;
  } else if (tx.gasPrice) {
    transaction.gasPrice = BigInt(tx.gasPrice);
  }

  if (type >= 1 && tx.accessList) {
    transaction.accessList = tx.accessList;
  }

  return ethers.Transaction.from(transaction).unsignedSerialized;
}

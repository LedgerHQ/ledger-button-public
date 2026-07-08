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

interface EtherscanRpcTransactionResponse {
  jsonrpc?: string;
  id?: number;
  result?: EtherscanRpcTransaction | null;
  status?: string;
  message?: string;
}

interface EtherscanAccountTransaction {
  hash: string;
  to: string | null;
  input: string;
  isError?: string;
}

interface EtherscanAccountResponse {
  status?: string;
  message?: string;
  result?: EtherscanAccountTransaction[] | string | null;
}

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_ETHERSCAN_API_KEY. Add it to your .env to fetch transactions.",
    );
  }
  return apiKey;
}

function buildEtherscanUrl(params: Record<string, string>): URL {
  const url = new URL(ETHERSCAN_V2_API_URL);
  url.searchParams.set("chainid", String(MAINNET_CHAIN_ID));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("apikey", getApiKey());
  return url;
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
  const url = buildEtherscanUrl({
    module: "proxy",
    action: "eth_getBlockByNumber",
    tag: "latest",
    boolean: "true",
  });

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

/**
 * Fetches the most recent transaction that calls a given contract (real
 * calldata, so it can be clear-signed on the device), and rebuilds its unsigned
 * RLP serialization so it can be replayed through `eth_signRawTransaction`.
 */
export async function fetchLatestUnsignedRawTxForContract(
  contract: string,
): Promise<{ rawTx: string; hash: string }> {
  const normalizedContract = contract.toLowerCase();

  const listUrl = buildEtherscanUrl({
    module: "account",
    action: "txlist",
    address: normalizedContract,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "25",
    sort: "desc",
  });

  const listResponse = await fetch(listUrl.toString());
  if (!listResponse.ok) {
    throw new Error(
      `Etherscan request failed with status ${listResponse.status}`,
    );
  }

  const listData = (await listResponse.json()) as EtherscanAccountResponse;
  if (!Array.isArray(listData.result)) {
    throw new Error(
      `Etherscan returned no transactions${
        typeof listData.result === "string"
          ? `: ${listData.result}`
          : listData.message
            ? `: ${listData.message}`
            : ""
      }`,
    );
  }

  const callTx = listData.result.find(
    (tx) =>
      tx.to != null &&
      tx.to.toLowerCase() === normalizedContract &&
      tx.input != null &&
      tx.input !== "0x" &&
      tx.isError !== "1",
  );
  if (!callTx) {
    throw new Error(
      "No recent transaction with calldata found for this contract",
    );
  }

  return fetchUnsignedRawTxByHash(callTx.hash);
}

async function fetchUnsignedRawTxByHash(
  hash: string,
): Promise<{ rawTx: string; hash: string }> {
  const url = buildEtherscanUrl({
    module: "proxy",
    action: "eth_getTransactionByHash",
    txhash: hash,
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Etherscan request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EtherscanRpcTransactionResponse;
  const tx = data.result;
  if (!tx) {
    throw new Error(
      `Etherscan returned no transaction${data.message ? `: ${data.message}` : ""}`,
    );
  }

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

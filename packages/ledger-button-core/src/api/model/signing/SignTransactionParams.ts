//EIP-1193 Transaction Object from eth_signTransaction/eth_sendTransaction
//see: https://ethereum.org/developers/docs/apis/json-rpc/#eth_signtransaction
export type Transaction = {
  chainId: number;
  data: string;
  to: string;
  value: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
};

export interface SignTransactionParams {
  transaction: Transaction;
  broadcast: boolean;
}

export function isSignTransactionParams(
  params: unknown,
): params is SignTransactionParams {
  return (
    typeof params === "object" && params !== null && "transaction" in params
  );
}

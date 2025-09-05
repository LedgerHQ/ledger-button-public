//EIP-1193 Transaction Object from eth_signTransaction/eth_sendTransaction
//see: https://ethereum.org/developers/docs/apis/json-rpc/#eth_signtransaction
export type Transaction = {
  chainId: number;
  data: string;
  from: string;
  gas: string;
  to: string;
  value: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
};

export interface SignTransactionParams {
  transaction: Transaction;
  broadcast: boolean;
}

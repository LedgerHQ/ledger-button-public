//EIP-1193 Transaction Object from eth_signTransaction/eth_sendTransaction
//see: https://ethereum.org/developers/docs/apis/json-rpc/#eth_signtransaction
export type Transaction = {
  chainId: number;
  data: string;
  from: string;
  gas: string;
  gasPrice: string | undefined;
  maxFeePerGas: string | undefined;
  maxPriorityFeePerGas: string | undefined;
  to: string;
  value: string;
  nonce: string | undefined;
};

export interface SignTransactionParams {
  transaction: Transaction;
}

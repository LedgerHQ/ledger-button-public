import type { BlockchainRpcMethods } from "@api/model/dappConfig/BlockchainConfig";

export const EVM_DEFAULT_RPC_METHODS: BlockchainRpcMethods = {
  local: [
    "eth_accounts",
    "eth_requestAccounts",
    "eth_chainId",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
    "eth_signTypedData_v4",
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_signRawTransaction",
    "eth_sendRawTransaction",
    "wallet_switchEthereumChain",
  ],
  broadcasted: [
    "eth_blockNumber",
    "eth_getBalance",
    "eth_getCode",
    "eth_estimateGas",
    "eth_call",
  ],
};

export const SOLANA_DEFAULT_RPC_METHODS: BlockchainRpcMethods = {
  local: [
    "eth_sendTransaction",
    "eth_sign",
    "eth_signTransaction",
    "eth_signTypedData",
    "eth_signTypedData_v4",
  ],
  broadcasted: ["eth_transactionCount", "eth_call"],
};

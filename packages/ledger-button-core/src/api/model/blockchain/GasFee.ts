/**
 * Neutral gas-fee shapes exchanged between core and a blockchain provider
 * module. Mirrors the fields an EVM provider needs without pulling core's
 * internal balance model across the package boundary.
 */
export type ProviderTransactionInfo = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

export type ProviderGasFeeEstimation = {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

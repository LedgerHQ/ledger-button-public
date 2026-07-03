/**
 * Minimal, per-blockchain configuration handed to a single blockchain provider
 * module (EVM, Solana, ...).
 *
 * This is the public, package-facing slice of the dApp config: a provider only
 * ever sees the entry that matches its own {@link BlockchainFamily}, never the
 * whole multi-chain dApp config. `blockchain` matches the provider family.
 */
export type BlockchainNetwork = {
  id: string;
  currencyId: string;
  currencyName: string;
  currencyTicker: string;
};

export type BlockchainRpcMethods = {
  local: string[];
  broadcasted: string[];
};

export type BlockchainAppDependencies = {
  appName: string;
  dependencies: string[];
  minVersion?: string;
};

export type BlockchainConfig = {
  blockchain: string;
  appName: string;
  networks: BlockchainNetwork[];
  rpcMethods: BlockchainRpcMethods;
  appDependencies: BlockchainAppDependencies;
};

export type DAppConfigV2Network = {
  id: string;
  currencyId: string;
  currencyName: string;
  currencyTicker: string;
};

export type DAppConfigV2RpcMethods = {
  local: string[];
  broadcasted: string[];
};

export type DAppConfigV2AppDependencies = {
  appName: string;
  dependencies: string[];
  minVersion?: string;
};

export type DAppConfigV2Blockchain = {
  blockchain: string;
  appName: string;
  networks: DAppConfigV2Network[];
  rpcMethods?: DAppConfigV2RpcMethods;
  appDependencies: DAppConfigV2AppDependencies;
};

export type DAppConfigV2FeatureFlags = Record<string, unknown>;

export type DAppConfigV2 = {
  name: string;
  liveAppId: string;
  domainUrl: string;
  referralUrl: string;
  blockchains: DAppConfigV2Blockchain[];
  featureFlags: DAppConfigV2FeatureFlags;
};

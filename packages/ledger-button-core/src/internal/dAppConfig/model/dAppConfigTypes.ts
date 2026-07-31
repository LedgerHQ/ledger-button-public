import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";

export type { BlockchainConfig };

export type DAppConfigFeatureFlags = Record<string, unknown>;

export type DAppConfig = {
  name: string;
  liveAppId: string;
  domainUrl: string;
  referralUrl: string;
  blockchains: BlockchainConfig[];
  featureFlags: DAppConfigFeatureFlags;
};

import type { BlockchainConfig } from "../../../../api/model/dappConfig/BlockchainConfig.js";

export type { BlockchainConfig };

export type DAppConfigV2FeatureFlags = Record<string, unknown>;

export type DAppConfigV2 = {
  name: string;
  liveAppId: string;
  domainUrl: string;
  referralUrl: string;
  blockchains: BlockchainConfig[];
  featureFlags: DAppConfigV2FeatureFlags;
};

import type {
  BlockchainAppDependency,
  BlockchainConfig,
} from "@api/model/dappConfig/BlockchainConfig";
import type { ConfigResponse } from "@internal/backend/types";

import type { DAppConfig } from "../model/dAppConfigTypes";

type ConfigResponseBlockchain = ConfigResponse["blockchains"][number];
type ConfigResponseDependency =
  ConfigResponseBlockchain["appDependencies"]["dependencies"][number];

/** The backend sends `minVersion: null` when a dependency has no lower bound. */
function mapAppDependency({
  name,
  minVersion,
}: ConfigResponseDependency): BlockchainAppDependency {
  return minVersion ? { name, minVersion } : { name };
}

function mapBlockchainConfig(
  blockchain: ConfigResponseBlockchain,
): BlockchainConfig {
  return {
    blockchain: blockchain.blockchain,
    appName: blockchain.appName,
    networks: blockchain.networks,
    rpcMethods: blockchain.rpcMethods,
    appDependencies: {
      appName: blockchain.appDependencies.appName,
      dependencies:
        blockchain.appDependencies.dependencies.map(mapAppDependency),
    },
  };
}

export function mapConfigResponseToDAppConfig(
  response: ConfigResponse,
): DAppConfig {
  return {
    name: response.name,
    liveAppId: response.liveAppId,
    domainUrl: response.domainUrl,
    referralUrl: response.referralUrl,
    blockchains: response.blockchains.map(mapBlockchainConfig),
    featureFlags: response.featureFlags,
  };
}

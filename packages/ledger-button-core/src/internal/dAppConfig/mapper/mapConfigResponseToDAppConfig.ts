import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type {
  BlockchainConfig,
  BlockchainNetwork,
} from "@api/model/dappConfig/BlockchainConfig";
import type { ConfigResponse } from "@internal/backend/types";

import {
  EVM_DEFAULT_RPC_METHODS,
  SOLANA_DEFAULT_RPC_METHODS,
} from "../defaults/defaultBlockchainRpcMethods";
import type { DAppConfig } from "../model/dAppConfigTypes";

const BLOCKCHAIN_FAMILIES: BlockchainFamily[] = ["ethereum", "solana"];

function resolveBlockchainFamily(currencyId: string): BlockchainFamily {
  return currencyId === "solana" ? "solana" : "ethereum";
}

function mapNetwork(
  network: ConfigResponse["supportedBlockchains"][number],
): BlockchainNetwork {
  return {
    id: network.id,
    currencyId: network.currency_id,
    currencyName: network.currency_name,
    currencyTicker: network.currency_ticker,
  };
}

function mapAppDependencies(
  response: ConfigResponse,
  family: BlockchainFamily,
): BlockchainConfig["appDependencies"] {
  const entry = response.appDependencies.find(
    (dependency) => dependency.blockchain === family,
  );

  if (!entry) {
    return { appName: family, dependencies: [] };
  }

  return {
    appName: entry.appName,
    dependencies: entry.dependencies.map((name) => ({ name })),
  };
}

function getRpcMethods(
  family: BlockchainFamily,
): BlockchainConfig["rpcMethods"] {
  return family === "solana"
    ? SOLANA_DEFAULT_RPC_METHODS
    : EVM_DEFAULT_RPC_METHODS;
}

function buildBlockchainConfig(
  response: ConfigResponse,
  family: BlockchainFamily,
  networks: BlockchainNetwork[],
): BlockchainConfig {
  const appDependencies = mapAppDependencies(response, family);

  return {
    blockchain: family,
    appName: appDependencies.appName,
    networks,
    appDependencies,
    rpcMethods: getRpcMethods(family),
  };
}

export function mapConfigResponseToDAppConfig(
  response: ConfigResponse,
  dAppIdentifier: string,
): DAppConfig {
  const networksByFamily = new Map<BlockchainFamily, BlockchainNetwork[]>();

  for (const network of response.supportedBlockchains) {
    const family = resolveBlockchainFamily(network.currency_id);
    const networks = networksByFamily.get(family) ?? [];
    networks.push(mapNetwork(network));
    networksByFamily.set(family, networks);
  }

  const blockchains = BLOCKCHAIN_FAMILIES.flatMap((family) => {
    const networks = networksByFamily.get(family);
    if (!networks) {
      return [];
    }

    return [buildBlockchainConfig(response, family, networks)];
  });

  return {
    name: dAppIdentifier,
    liveAppId: dAppIdentifier,
    domainUrl: response.domainUrl,
    referralUrl: response.referralUrl,
    blockchains,
    featureFlags: {},
  };
}

import { z } from "zod";

const BlockchainNetworkSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  currencyName: z.string(),
  currencyTicker: z.string(),
});

const BlockchainRpcMethodsSchema = z.object({
  local: z.array(z.string()),
  broadcasted: z.array(z.string()),
});

const BlockchainAppDependenciesSchema = z.object({
  appName: z.string(),
  dependencies: z.array(
    z.object({
      name: z.string(),
      minVersion: z.string().nullish(),
    }),
  ),
});

const BlockchainConfigSchema = z.object({
  blockchain: z.string(),
  appName: z.string(),
  networks: z.array(BlockchainNetworkSchema),
  rpcMethods: BlockchainRpcMethodsSchema,
  appDependencies: BlockchainAppDependenciesSchema,
});

export const ConfigResponseSchema = z.object({
  name: z.string(),
  liveAppId: z.string(),
  domainUrl: z.string(),
  referralUrl: z.string(),
  blockchains: z.array(BlockchainConfigSchema),
  featureFlags: z.record(z.string(), z.unknown()),
});

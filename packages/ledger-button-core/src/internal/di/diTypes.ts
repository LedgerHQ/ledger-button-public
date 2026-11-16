import { type DmkConfig } from "@ledgerhq/device-management-kit";

import type { BlockchainProviderFactory } from "@api/blockchain-provider/model/BlockchainProviderFactory";

import type { Environment } from "../config/model/config";
import { LogLevelKey } from "../logger/model/constant";

export type DeviceModuleOptions = Partial<DmkConfig>;

export type MockServerConfig = {
  serverToken?: string;
  serverUrl?: string;
};

export type ContainerOptions = {
  apiKey?: string;
  dAppIdentifier?: string;
  dmkConfig?: DeviceModuleOptions;
  loggerLevel?: LogLevelKey;
  dmkLogLevel?: LogLevelKey;
  environment?: Environment;
  /**
   * Host-supplied factories that create blockchain providers. Required for any
   * family to load; core never imports family packages.
   */
  blockchainProviderFactories?: BlockchainProviderFactory[];
  devConfig?: {
    stub: Partial<{
      balance: boolean;
      base: boolean;
      account: boolean;
      device: boolean;
      web3Provider: boolean;
      transactionHistory: boolean;
      dAppConfig: boolean;
    }>;
    mock?: MockServerConfig;
  };
};

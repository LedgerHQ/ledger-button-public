import { type DmkConfig } from "@ledgerhq/device-management-kit";

import { LogLevelKey } from "./logger/model/constant";
import type { BlockchainProviderFactoryRegistration } from "../api/blockchain-provider/model/BlockchainProviderFactory";

export type DeviceModuleOptions = Partial<DmkConfig>;

export type ContainerOptions = {
  apiKey?: string;
  dAppIdentifier?: string;
  dmkConfig?: DeviceModuleOptions;
  loggerLevel?: LogLevelKey;
  dmkLogLevel?: LogLevelKey;
  environment?: "staging" | "production";
  /**
   * Host-supplied factories that create blockchain providers. Required for any
   * family to load; core never imports family packages.
   */
  blockchainProviderFactories?: BlockchainProviderFactoryRegistration[];
  devConfig?: {
    stub: Partial<{
      balance: boolean;
      base: boolean;
      account: boolean;
      device: boolean;
      web3Provider: boolean;
      transactionHistory: boolean;
    }>;
  };
};

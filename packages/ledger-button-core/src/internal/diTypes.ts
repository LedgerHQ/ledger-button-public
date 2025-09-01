import { type DmkConfig } from "@ledgerhq/device-management-kit";

import { LogLevelKey } from "./logger/model/constant.js";

export type DeviceModuleOptions = Partial<DmkConfig>;

export type ContainerOptions = {
  stub: Partial<{
    base: boolean;
    account: boolean;
    device: boolean;
    web3Provider: boolean;
  }>;
  supportedNetworks?: string[];
  loggerLevel?: LogLevelKey;
  dmkConfig?: DeviceModuleOptions;
  // TODO: Remove optional and default values
  apiKey?: string;
  dAppIdentifier?: string;
};

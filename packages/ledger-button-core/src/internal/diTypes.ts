import { type DmkConfig } from "@ledgerhq/device-management-kit";

import { LogLevel } from "./logger/model/constant.js";

export type DeviceModuleOptions = Partial<DmkConfig>;

export type ContainerOptions = {
  stub?: boolean;
  stubDevice?: boolean;
  stubWeb3Provider?: boolean;
  supportedNetworks?: string[];
  loggerLevel?: LogLevel;
  dmkConfig?: DeviceModuleOptions;
};

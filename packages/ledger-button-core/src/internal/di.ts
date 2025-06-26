import { Container } from "inversify";

import { dmkModuleFactory } from "./dmk/dmkModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { LOG_LEVELS, LogLevel } from "./logger/model/constant.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";

export type ContainerOptions = {
  stub?: boolean;
  supportedNetworks?: string[];
  loggerLevel?: LogLevel;
};

export async function createContainer({
  stub = false,
  supportedNetworks: _supportedNetworks = [],
  loggerLevel = LOG_LEVELS.info,
}: ContainerOptions) {
  const container = new Container();

  await Promise.all([
    container.load(dmkModuleFactory({ stub })),
    container.load(storageModuleFactory({ stub })),
    container.load(networkModuleFactory({ stub })),
    container.load(loggerModuleFactory({ stub, loggerLevel })),
  ]);

  return container;
}

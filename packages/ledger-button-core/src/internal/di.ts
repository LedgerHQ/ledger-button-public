import { Container } from "inversify";

import { deviceModuleFactory } from "./device/deviceModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { LOG_LEVELS } from "./logger/model/constant.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { ContainerOptions } from "./diTypes.js";

export async function createContainer({
  stub = false,
  supportedNetworks: _supportedNetworks = [],
  loggerLevel = LOG_LEVELS.info,
  dmkConfig,
}: ContainerOptions) {
  const container = new Container();

  await Promise.all([
    container.load(deviceModuleFactory({ stub, dmkConfig })),
    container.load(storageModuleFactory({ stub })),
    container.load(networkModuleFactory({ stub })),
    container.load(loggerModuleFactory({ stub, loggerLevel })),
  ]);

  return container;
}

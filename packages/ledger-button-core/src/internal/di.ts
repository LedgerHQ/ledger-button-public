import { Container } from "inversify";

import { accountModuleFactory } from "./account/accountModule.js";
import { deviceModuleFactory } from "./device/deviceModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { LOG_LEVELS } from "./logger/model/constant.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { ContainerOptions } from "./diTypes.js";

export async function createContainer({
  stub = false,
  stubDevice = false,
  supportedNetworks: _supportedNetworks = [],
  loggerLevel = LOG_LEVELS.info,
  dmkConfig,
}: ContainerOptions) {
  const container = new Container();

  await container.load(
    loggerModuleFactory({ stub, loggerLevel }),
    accountModuleFactory({ stub }),
    deviceModuleFactory({ stub: stubDevice, dmkConfig }),
    storageModuleFactory({ stub }),
    networkModuleFactory({ stub }),
  );

  return container;
}

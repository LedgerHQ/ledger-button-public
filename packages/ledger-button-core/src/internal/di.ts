import { Container } from "inversify";

import { accountModuleFactory } from "./account/accountModule.js";
import { backendModuleFactory } from "./backend/backendModule.js";
import { cloudSyncModuleFactory } from "./cloudsync/cloudsyncModule.js";
import { cryptographicModuleFactory } from "./cryptographic/cryptographicModule.js";
import { deviceModuleFactory } from "./device/deviceModule.js";
import { ledgerSyncModuleFactory } from "./ledgersync/ledgerSyncModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { LOG_LEVELS } from "./logger/model/constant.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { transactionModuleFactory } from "./transaction/transactionModule.js";
import { usecasesModuleFactory } from "./usecases/usecasesModule.js";
import { web3ProviderModuleFactory } from "./web3-provider/web3ProviderModule.js";
import { ContainerOptions } from "./diTypes.js";

export function createContainer({
  stub = false,
  stubDevice = false,
  stubWeb3Provider = false,
  supportedNetworks: _supportedNetworks = [],
  loggerLevel = LOG_LEVELS.info,
  dmkConfig,
}: ContainerOptions) {
  const container = new Container();

  container.loadSync(
    loggerModuleFactory({ stub, loggerLevel }),
    accountModuleFactory({ stub }),
    backendModuleFactory({ stub }),
    deviceModuleFactory({ stub: stubDevice, dmkConfig }),
    storageModuleFactory({ stub }),
    networkModuleFactory({ stub }),
    transactionModuleFactory({ stub }),
    web3ProviderModuleFactory({ stub: stubWeb3Provider }),
    ledgerSyncModuleFactory({ stub }),
    cryptographicModuleFactory({ stub }),
    cloudSyncModuleFactory({ stub }),
    usecasesModuleFactory({ stub }),
  );

  return container;
}

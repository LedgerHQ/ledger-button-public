import { Container } from "inversify";

import { accountModuleFactory } from "./account/accountModule.js";
import { alpacaModuleFactory } from "./alpaca/alpacaModule.js";
import { backendModuleFactory } from "./backend/backendModule.js";
import { cloudSyncModuleFactory } from "./cloudsync/cloudsyncModule.js";
import { configModuleFactory } from "./config/configModule.js";
import { cryptographicModuleFactory } from "./cryptographic/cryptographicModule.js";
import { dAppConfigModuleFactory } from "./dAppConfig/di/dAppConfigModule.js";
import { deviceModuleFactory } from "./device/deviceModule.js";
import { ledgerSyncModuleFactory } from "./ledgersync/ledgerSyncModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { transactionModuleFactory } from "./transaction/transactionModule.js";
import { web3ProviderModuleFactory } from "./web3-provider/web3ProviderModule.js";
import { ContainerOptions } from "./diTypes.js";

export function createContainer({
  loggerLevel = "info",
  dmkConfig,
  apiKey,
  dAppIdentifier,
  environment = "production",
  devConfig = {
    stub: {
      base: false,
      account: false,
      device: false,
      web3Provider: false,
      alpaca: false,
      dAppConfig: false,
    },
  },
}: ContainerOptions) {
  const container = new Container();

  container.loadSync(
    configModuleFactory({ loggerLevel, apiKey, dAppIdentifier, environment }),
    alpacaModuleFactory({ stub: devConfig.stub.alpaca }),
    loggerModuleFactory({ stub: devConfig.stub.base }),
    accountModuleFactory({ stub: devConfig.stub.account }),
    backendModuleFactory({ stub: devConfig.stub.base }),
    dAppConfigModuleFactory({ stub: devConfig.stub.dAppConfig }),
    deviceModuleFactory({ stub: devConfig.stub.device, dmkConfig }),
    storageModuleFactory({ stub: devConfig.stub.base }),
    networkModuleFactory({ stub: devConfig.stub.base }),
    transactionModuleFactory({ stub: devConfig.stub.base }),
    web3ProviderModuleFactory({ stub: devConfig.stub.web3Provider }),
    ledgerSyncModuleFactory({ stub: devConfig.stub.base }),
    cryptographicModuleFactory({ stub: devConfig.stub.base }),
    cloudSyncModuleFactory({ stub: devConfig.stub.base }),
  );

  return container;
}

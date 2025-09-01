import { Container } from "inversify";

import { accountModuleFactory } from "./account/accountModule.js";
import { backendModuleFactory } from "./backend/backendModule.js";
import { cloudSyncModuleFactory } from "./cloudsync/cloudsyncModule.js";
import { configModuleFactory } from "./config/configModule.js";
import { cryptographicModuleFactory } from "./cryptographic/cryptographicModule.js";
import { deviceModuleFactory } from "./device/deviceModule.js";
import { ledgerSyncModuleFactory } from "./ledgersync/ledgerSyncModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { transactionModuleFactory } from "./transaction/transactionModule.js";
import { web3ProviderModuleFactory } from "./web3-provider/web3ProviderModule.js";
import { ContainerOptions } from "./diTypes.js";

export function createContainer({
  stub = {
    base: false,
    account: false,
    device: false,
    web3Provider: false,
  },
  supportedNetworks: _supportedNetworks = [],
  loggerLevel = "info",
  dmkConfig,
  apiKey,
  dAppIdentifier,
}: ContainerOptions) {
  const container = new Container();

  container.loadSync(
    configModuleFactory({ loggerLevel, apiKey, dAppIdentifier }),
    loggerModuleFactory({ stub: stub.base }),
    accountModuleFactory({ stub: stub.account }),
    backendModuleFactory({ stub: stub.base }),
    deviceModuleFactory({ stub: stub.device, dmkConfig }),
    storageModuleFactory({ stub: stub.base }),
    networkModuleFactory({ stub: stub.base }),
    transactionModuleFactory({ stub: stub.base }),
    web3ProviderModuleFactory({ stub: stub.web3Provider }),
    ledgerSyncModuleFactory({ stub: stub.base }),
    cryptographicModuleFactory({ stub: stub.base }),
    cloudSyncModuleFactory({ stub: stub.base }),
  );

  return container;
}

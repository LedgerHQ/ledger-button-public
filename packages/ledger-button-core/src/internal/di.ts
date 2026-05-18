import { Container } from "inversify";

import { accountModuleFactory } from "./account/accountModule.js";
import { backendModuleFactory } from "./backend/backendModule.js";
import { balanceModuleFactory } from "./balance/balanceModule.js";
import { cloudSyncModuleFactory } from "./cloudsync/cloudsyncModule.js";
import { configModuleFactory } from "./config/configModule.js";
import { consentModuleFactory } from "./consent/consentModule.js";
import { contextModuleFactory } from "./context/contextModule.js";
import { cryptographicModuleFactory } from "./cryptographic/cryptographicModule.js";
import { currencyModuleFactory } from "./currency/currencyModule.js";
import { dAppConfigModuleFactory } from "./dAppConfig/di/dAppConfigModule.js";
import { deviceModuleFactory } from "./device/deviceModule.js";
import { DEFAULT_ERROR_TRACKING_CONFIG } from "./event-tracking/config/ErrorTrackingConfig.js";
import { eventTrackingModuleFactory } from "./event-tracking/eventTrackingModule.js";
import { evmProviderModuleFactory } from "./evm-provider/evmProviderModule.js";
import { ledgerSyncModuleFactory } from "./ledgersync/ledgerSyncModule.js";
import { loggerModuleFactory } from "./logger/loggerModule.js";
import { modalModuleFactory } from "./modal/modalModule.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { pendingTransactionModuleFactory } from "./pending-transaction/pendingTransactionModule.js";
import { platformModuleFactory } from "./platform/platformModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";
import { transactionModuleFactory } from "./transaction/transactionModule.js";
import { transactionHistoryModuleFactory } from "./transaction-history/di/transactionHistoryModule.js";
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
      balance: false,
      dAppConfig: false,
      transactionHistory: false,
    },
  },
}: ContainerOptions) {
  const container = new Container();

  container.loadSync(
    configModuleFactory({ loggerLevel, apiKey, dAppIdentifier, environment }),
    currencyModuleFactory(),
    balanceModuleFactory({ stub: devConfig.stub.balance }),
    loggerModuleFactory({
      stub: devConfig.stub.base,
      errorTrackingConfig: DEFAULT_ERROR_TRACKING_CONFIG,
    }),
    accountModuleFactory({ stub: devConfig.stub.account }),
    backendModuleFactory({ stub: devConfig.stub.base }),
    dAppConfigModuleFactory({ stub: devConfig.stub.dAppConfig }),
    deviceModuleFactory({ stub: devConfig.stub.device, dmkConfig }),
    eventTrackingModuleFactory({ stub: devConfig.stub.base }),
    storageModuleFactory({ stub: devConfig.stub.base }),
    consentModuleFactory(),
    networkModuleFactory({ stub: devConfig.stub.base }),
    transactionModuleFactory({ stub: devConfig.stub.base }),
    transactionHistoryModuleFactory({
      stub: devConfig.stub.transactionHistory,
    }),
    evmProviderModuleFactory({ stub: devConfig.stub.web3Provider }),
    ledgerSyncModuleFactory({ stub: devConfig.stub.base }),
    cryptographicModuleFactory({ stub: devConfig.stub.base }),
    cloudSyncModuleFactory({ stub: devConfig.stub.base }),
    platformModuleFactory(),
    modalModuleFactory(),
    contextModuleFactory(),
    pendingTransactionModuleFactory(),
  );

  return container;
}

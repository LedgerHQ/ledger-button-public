import { Container } from "inversify";

import { accountModuleFactory } from "./account/di/accountModule.js";
import { backendModuleFactory } from "./backend/di/backendModule.js";
import { balanceModuleFactory } from "./balance/di/balanceModule.js";
import { cloudSyncModuleFactory } from "./cloudsync/di/cloudsyncModule.js";
import { configModuleFactory } from "./config/di/configModule.js";
import { consentModuleFactory } from "./consent/di/consentModule.js";
import { contextModuleFactory } from "./context/di/contextModule.js";
import { cryptographicModuleFactory } from "./cryptographic/di/cryptographicModule.js";
import { currencyModuleFactory } from "./currency/di/currencyModule.js";
import { dAppConfigModuleFactory } from "./dAppConfig/di/dAppConfigModule.js";
import { deviceModuleFactory } from "./device/di/deviceModule.js";
import { DEFAULT_ERROR_TRACKING_CONFIG } from "./event-tracking/config/ErrorTrackingConfig.js";
import { eventTrackingModuleFactory } from "./event-tracking/di/eventTrackingModule.js";
import { ledgerSyncModuleFactory } from "./ledgersync/di/ledgerSyncModule.js";
import { loggerModuleFactory } from "./logger/di/loggerModule.js";
import { modalModuleFactory } from "./modal/di/modalModule.js";
import { navigationModuleFactory } from "./navigation/di/navigationModule.js";
import { networkModuleFactory } from "./network/di/networkModule.js";
import { pendingTransactionModuleFactory } from "./pending-transaction/di/pendingTransactionModule.js";
import { platformModuleFactory } from "./platform/di/platformModule.js";
import { storageModuleFactory } from "./storage/di/storageModule.js";
import { transactionHistoryModuleFactory } from "./transaction-history/di/transactionHistoryModule.js";
import { blockchainProviderModuleFactory } from "../internal/blockchain-provider/di/blockchainProviderModule.js";
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
    dAppConfigModuleFactory(),
    deviceModuleFactory({ stub: devConfig.stub.device, dmkConfig }),
    eventTrackingModuleFactory({ stub: devConfig.stub.base }),
    storageModuleFactory({ stub: devConfig.stub.base }),
    consentModuleFactory(),
    networkModuleFactory({ stub: devConfig.stub.base }),
    transactionHistoryModuleFactory({
      stub: devConfig.stub.transactionHistory,
    }),
    blockchainProviderModuleFactory(),
    ledgerSyncModuleFactory({ stub: devConfig.stub.base }),
    cryptographicModuleFactory({ stub: devConfig.stub.base }),
    cloudSyncModuleFactory({ stub: devConfig.stub.base }),
    platformModuleFactory(),
    modalModuleFactory(),
    navigationModuleFactory(),
    contextModuleFactory(),
    pendingTransactionModuleFactory(),
  );

  return container;
}

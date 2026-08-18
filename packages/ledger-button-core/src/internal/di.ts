import { Container } from "inversify";

import { accountModuleFactory } from "./account/di/accountModule";
import { backendModuleFactory } from "./backend/di/backendModule";
import { balanceModuleFactory } from "./balance/di/balanceModule";
import { cloudSyncModuleFactory } from "./cloudsync/di/cloudsyncModule";
import { configModuleFactory } from "./config/di/configModule";
import { consentModuleFactory } from "./consent/di/consentModule";
import { contextModuleFactory } from "./context/di/contextModule";
import { cryptographicModuleFactory } from "./cryptographic/di/cryptographicModule";
import { currencyModuleFactory } from "./currency/di/currencyModule";
import { dAppConfigModuleFactory } from "./dAppConfig/di/dAppConfigModule";
import { deviceModuleFactory } from "./device/di/deviceModule";
import { DEFAULT_ERROR_TRACKING_CONFIG } from "./event-tracking/config/ErrorTrackingConfig";
import { eventTrackingModuleFactory } from "./event-tracking/di/eventTrackingModule";
import { ledgerSyncModuleFactory } from "./ledgersync/di/ledgerSyncModule";
import { loggerModuleFactory } from "./logger/di/loggerModule";
import { modalModuleFactory } from "./modal/di/modalModule";
import { navigationModuleFactory } from "./navigation/di/navigationModule";
import { networkModuleFactory } from "./network/di/networkModule";
import { pendingTransactionModuleFactory } from "./pending-transaction/di/pendingTransactionModule";
import { platformModuleFactory } from "./platform/di/platformModule";
import { storageModuleFactory } from "./storage/di/storageModule";
import { transactionHistoryModuleFactory } from "./transaction-history/di/transactionHistoryModule";
import { blockchainProviderModuleFactory } from "../internal/blockchain-provider/di/blockchainProviderModule";
import { ContainerOptions } from "./diTypes";

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

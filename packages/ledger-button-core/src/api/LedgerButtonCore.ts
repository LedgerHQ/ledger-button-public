import { Container, Factory } from "inversify";
import { BehaviorSubject, Observable, tap } from "rxjs";

import { ButtonCoreContext } from "./model/ButtonCoreContext.js";
import { JSONRPCRequest } from "./model/eip/EIPTypes.js";
import { SignPersonalMessageParams } from "./model/index.js";
import {
  AuthContext,
  LedgerSyncAuthenticateResponse,
} from "./model/LedgerSyncAuthenticateResponse.js";
import { SignFlowStatus } from "./model/signing/SignFlowStatus.js";
import { SignRawTransactionParams } from "./model/signing/SignRawTransactionParams.js";
import { SignTransactionParams } from "./model/signing/SignTransactionParams.js";
import { SignTypedMessageParams } from "./model/signing/SignTypedMessageParams.js";
import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { type Account, type AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccountsUseCase } from "../internal/account/use-case/fetchAccountsUseCase.js";
import { alpacaModuleTypes } from "../internal/alpaca/alpacaModuleTypes.js";
import { type AlpacaBalanceRequest } from "../internal/alpaca/model/types.js";
import { type AlpacaService } from "../internal/alpaca/service/AlpacaService.js";
import { backendModuleTypes } from "../internal/backend/backendModuleTypes.js";
import { type BackendService } from "../internal/backend/BackendService.js";
import { configModuleTypes } from "../internal/config/configModuleTypes.js";
import { Config } from "../internal/config/model/config.js";
import { dAppConfigModuleTypes } from "../internal/dAppConfig/di/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../internal/dAppConfig/service/DAppConfigService.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import {
  type ConnectionType,
  type DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import { ListAvailableDevices } from "../internal/device/use-case/ListAvailableDevices.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { type ContainerOptions } from "../internal/diTypes.js";
import { eventTrackingModuleTypes } from "../internal/event-tracking/eventTrackingModuleTypes.js";
import { type EventTrackingService } from "../internal/event-tracking/EventTrackingService.js";
import { EventTrackingUtils } from "../internal/event-tracking/EventTrackingUtils.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/ledgerSyncModuleTypes.js";
import { LedgerSyncService } from "../internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../internal/logger/loggerModuleTypes.js";
import { LOG_LEVELS } from "../internal/logger/model/constant.js";
import { LoggerPublisher } from "../internal/logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { type StorageService } from "../internal/storage/StorageService.js";
import { type TransactionService } from "../internal/transaction/service/TransactionService.js";
import { transactionModuleTypes } from "../internal/transaction/transactionModuleTypes.js";
import { JSONRPCCallUseCase } from "../internal/web3-provider/use-case/JSONRPCRequest.js";
import { web3ProviderModuleTypes } from "../internal/web3-provider/web3ProviderModuleTypes.js";

export type LedgerButtonCoreOptions = ContainerOptions;
export class LedgerButtonCore {
  private container!: Container;
  private _pendingTransactionParams?:
    | SignRawTransactionParams
    | SignTransactionParams;
  private readonly _logger: LoggerPublisher;

  private _currentContext: BehaviorSubject<ButtonCoreContext> =
    new BehaviorSubject<ButtonCoreContext>({
      connectedDevice: undefined,
      selectedAccount: undefined,
      trustChainId: undefined,
      applicationPath: undefined,
    });

  constructor(private readonly opts: LedgerButtonCoreOptions) {
    this.container = createContainer(this.opts);
    const loggerFactory = this.container.get<Factory<LoggerPublisher>>(
      loggerModuleTypes.LoggerPublisher,
    );
    this._logger = loggerFactory("[Ledger Button Core]");
    this.initializeContext();
  }

  private async initializeContext() {
    this._logger.debug("Initializing context");

    //Fetch dApp config that will be used later for fetching supported blockchains/referral url/etc.
    await this.container
      .get<DAppConfigService>(dAppConfigModuleTypes.DAppConfigService)
      .getDAppConfig();

    //TODO throw error if dApp config is not found ?

    // Restore selected account from storage
    const selectedAccount = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getSelectedAccount()
      .extract();

    // Restore trust chain id from storage
    const trustChainId = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getTrustChainId()
      .extract();

    const isTrustChainValid = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .isTrustChainValid();

    if (trustChainId && !isTrustChainValid) {
      this._logger.debug("Logging out, trust chain is expired");
      await this.disconnect();
    }

    // Restore context
    this._currentContext.next({
      connectedDevice: undefined,
      selectedAccount: isTrustChainValid ? selectedAccount : undefined,
      trustChainId: isTrustChainValid ? trustChainId : undefined,
      applicationPath: undefined,
    });
  }

  async disconnect() {
    this._logger.debug("Disconnecting from device");
    await this.disconnectFromDevice();
    this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .resetStorage();

    this._currentContext.next({
      connectedDevice: undefined,
      selectedAccount: undefined,
      trustChainId: undefined,
      applicationPath: undefined,
    });

    try {
      await this.container.unbindAll();
    } catch (error) {
      this._logger.error("Error unbinding container", { error });
    } finally {
      this._logger.debug("Recreating container");
      this.container = createContainer(this.opts);
    }
  }

  // Device methods
  async connectToDevice(type: ConnectionType) {
    this._logger.debug("Connecting to device", { type });
    const device = await this.container
      .get<ConnectDevice>(deviceModuleTypes.ConnectDeviceUseCase)
      .execute({ type });

    this._currentContext.next({
      connectedDevice: device,
      selectedAccount: this._currentContext.value.selectedAccount,
      trustChainId: this._currentContext.value.trustChainId,
      applicationPath: this._currentContext.value.applicationPath,
    });

    try {
      const eventTrackingService = this.container.get<EventTrackingService>(
        eventTrackingModuleTypes.EventTrackingService,
      );
      const sessionId = this.container
        .get<DeviceManagementKitService>(deviceModuleTypes.DeviceManagementKitService)
        .sessionId;

      if (sessionId) {
        const openSessionEvent = EventTrackingUtils.createOpenSessionEvent({
          dAppId: this.getConfig().dAppIdentifier,
          sessionId,
        });
        await eventTrackingService.trackEvent(openSessionEvent);
      }
    } catch (error) {
      this._logger.error("Failed to track open session event", { error });
    }

    return device;
  }

  async disconnectFromDevice() {
    this._logger.debug("Disconnecting from device");
    const result = await this.container
      .get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
      .execute();

    this._currentContext.next({
      connectedDevice: undefined,
      selectedAccount: undefined,
      trustChainId: this._currentContext.value.trustChainId,
      applicationPath: this._currentContext.value.applicationPath,
    });

    return result;
  }

  async getReferralUrl() {
    return this.container
      .get<DAppConfigService>(dAppConfigModuleTypes.DAppConfigService)
      .getDAppConfig()
      .then((res) => res.referralUrl);
  }

  async switchDevice(type: ConnectionType) {
    this._logger.debug("Switching device", { type });
    return this.container
      .get<SwitchDevice>(deviceModuleTypes.SwitchDeviceUseCase)
      .execute({ type });
  }

  // Account methods
  async fetchAccounts() {
    this._logger.debug("Fetching accounts");
    return this.container
      .get<FetchAccountsUseCase>(accountModuleTypes.FetchAccountsUseCase)
      .execute();
  }

  getAccounts() {
    this._logger.debug("Getting accounts");
    return this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getAccounts();
  }

  selectAccount(address: string) {
    this._logger.debug("Selecting account", { address });
    this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .selectAccount(address);

    const selectedAccount = this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getSelectedAccount();

    this._currentContext.next({
      connectedDevice: this._currentContext.value.connectedDevice,
      selectedAccount: selectedAccount ?? undefined,
      trustChainId: this._currentContext.value.trustChainId,
      applicationPath: this._currentContext.value.applicationPath,
    });

    this.trackOnboardingEvent(selectedAccount);
  }

  private async trackOnboardingEvent(selectedAccount: Account | null): Promise<void> {
    try {
      const eventTrackingService = this.container.get<EventTrackingService>(
        eventTrackingModuleTypes.EventTrackingService,
      );
      const sessionId = this.container
        .get<DeviceManagementKitService>(deviceModuleTypes.DeviceManagementKitService)
        .sessionId;
      const trustChainId = this._currentContext.value.trustChainId;

      if (!sessionId || !trustChainId || !selectedAccount) {
        return;
      }

      const onboardingEvent = EventTrackingUtils.createOnboardingEvent({
        dAppId: this.getConfig().dAppIdentifier,
        sessionId,
        ledgerSyncUserId: trustChainId,
        accountCurrency: selectedAccount.currencyId || "ETH",
        accountBalance: selectedAccount.balance?.toString() || "0",
      });
      await eventTrackingService.trackEvent(onboardingEvent);
    } catch (error) {
      this._logger.error("Failed to track onboarding event", { error });
    }
  }

  getSelectedAccount() {
    this._logger.debug("Getting selected account");
    return this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getSelectedAccount()
      .extract();
  }

  // Device methods
  getConnectedDevice() {
    this._logger.debug("Getting connected device");
    return this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    ).connectedDevice;
  }

  async listAvailableDevices() {
    this._logger.debug("Listing available devices");
    return this.container
      .get<ListAvailableDevices>(deviceModuleTypes.ListAvailableDevicesUseCase)
      .execute();
  }

  // Transaction methods
  sign(
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignPersonalMessageParams,
    broadcast: boolean,
  ): Observable<SignFlowStatus> {
    this._logger.debug("Signing transaction", { params });
    return this.container
      ?.get<TransactionService>(transactionModuleTypes.TransactionService)
      .sign(params, broadcast);
  }

  setPendingTransactionParams(
    params: SignRawTransactionParams | SignTransactionParams | undefined,
  ) {
    this._logger.debug("Setting pending transaction params", { params });
    this._pendingTransactionParams = params;
  }

  getPendingTransactionParams():
    | SignRawTransactionParams
    | SignTransactionParams
    | undefined {
    this._logger.debug("Getting pending transaction params");
    return this._pendingTransactionParams;
  }

  getTransactionService(): TransactionService {
    this._logger.debug("Getting transaction service");
    return this.container.get<TransactionService>(
      transactionModuleTypes.TransactionService,
    );
  }

  async jsonRpcRequest(args: JSONRPCRequest) {
    this._logger.debug("JSON RPC request", { args });
    return this.container
      .get<JSONRPCCallUseCase>(web3ProviderModuleTypes.JSONRPCCallUseCase)
      .execute(args);
  }

  getBackendService(): BackendService {
    this._logger.debug("Getting backend service");
    return this.container.get<BackendService>(
      backendModuleTypes.BackendService,
    );
  }

  connectToLedgerSync(): Observable<LedgerSyncAuthenticateResponse> {
    this._logger.debug("Connecting to ledger sync");

    try {
      const eventTrackingService = this.container.get<EventTrackingService>(
        eventTrackingModuleTypes.EventTrackingService,
      );
      const sessionId = this.container
        .get<DeviceManagementKitService>(deviceModuleTypes.DeviceManagementKitService)
        .sessionId;

      if (!sessionId) {
        throw new Error("Session ID is missing");
      }

      const openLedgerSyncEvent = EventTrackingUtils.createOpenLedgerSyncEvent({
        dAppId: this.getConfig().dAppIdentifier,
        sessionId,
      });
      eventTrackingService.trackEvent(openLedgerSyncEvent).catch((error) => {
        this._logger.error("Failed to track open ledger sync event", { error });
      });
    } catch (error) {
      this._logger.error("Failed to track open ledger sync event", { error });
    }

    const res = this.container
      .get<LedgerSyncService>(ledgerSyncModuleTypes.LedgerSyncService)
      .authenticate();

    return res.pipe(
      tap(async (res: LedgerSyncAuthenticateResponse) => {
        if (!this.isAuthContext(res)) return;

        this._currentContext.next({
          connectedDevice: this._currentContext.value.connectedDevice,
          selectedAccount: this._currentContext.value.selectedAccount,
          trustChainId: res.trustChainId,
          applicationPath: res.applicationPath,
        });

        try {
          const eventTrackingService = this.container.get<EventTrackingService>(
            eventTrackingModuleTypes.EventTrackingService,
          );
          const sessionId = this.container
            .get<DeviceManagementKitService>(deviceModuleTypes.DeviceManagementKitService)
            .sessionId;

          if (sessionId) {
            const ledgerSyncActivatedEvent = EventTrackingUtils.createLedgerSyncActivatedEvent({
              dAppId: this.getConfig().dAppIdentifier,
              sessionId,
              ledgerSyncUserId: res.trustChainId, // Using trustChainId as user ID
            });
            await eventTrackingService.trackEvent(ledgerSyncActivatedEvent);
          }
        } catch (error) {
          this._logger.error("Failed to track ledger sync activated event", { error });
        }
      }),
    );
  }

  private isAuthContext(
    res: LedgerSyncAuthenticateResponse,
  ): res is AuthContext {
    return "trustChainId" in res && "applicationPath" in res;
  }

  observeContext(): Observable<ButtonCoreContext> {
    return this._currentContext.asObservable();
  }

  // Coin methods
  async getBalance(request: AlpacaBalanceRequest) {
    return this.container
      .get<AlpacaService>(alpacaModuleTypes.AlpacaService)
      .getBalance(request);
  }

  // Config methods
  getConfig(): Config {
    return this.container.get<Config>(configModuleTypes.Config);
  }

  setLogLevel(logLevel: keyof typeof LOG_LEVELS) {
    this.container.get<Config>(configModuleTypes.Config).setLogLevel(logLevel);
  }

  isSupported() {
    return this.container
      .get<DeviceManagementKitService>(
        deviceModuleTypes.DeviceManagementKitService,
      )
      .dmk.isEnvironmentSupported();
  }
}

import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { Container, Factory } from "inversify";
import { Observable, tap } from "rxjs";

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
import { getChainIdFromCurrencyId } from "./utils/index.js";
import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { type AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccountsUseCase } from "../internal/account/use-case/fetchAccountsUseCase.js";
import { backendModuleTypes } from "../internal/backend/backendModuleTypes.js";
import { type BackendService } from "../internal/backend/BackendService.js";
import { configModuleTypes } from "../internal/config/configModuleTypes.js";
import { Config } from "../internal/config/model/config.js";
import { contextModuleTypes } from "../internal/context/contextModuleTypes.js";
import { ContextService } from "../internal/context/ContextService.js";
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
import { TrackLedgerSyncActivated } from "../internal/event-tracking/usecase/TrackLedgerSyncActivated.js";
import { TrackLedgerSyncOpened } from "../internal/event-tracking/usecase/TrackLedgerSyncOpened.js";
import { TrackOnboarding } from "../internal/event-tracking/usecase/TrackOnboarding.js";
import { TrackOpenSession } from "../internal/event-tracking/usecase/TrackOpenSession.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/ledgerSyncModuleTypes.js";
import { LedgerSyncService } from "../internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../internal/logger/loggerModuleTypes.js";
import { LOG_LEVELS } from "../internal/logger/model/constant.js";
import { LoggerPublisher } from "../internal/logger/service/LoggerPublisher.js";
import { modalModuleTypes } from "../internal/modal/modalModuleTypes.js";
import { ModalService } from "../internal/modal/service/ModalService.js";
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
  private _pendingAccountAddress?: string;
  private readonly _logger: LoggerPublisher;
  // @ts-expect-error making sure ModalService is created, not used
  private readonly _modalService: ModalService;
  private readonly _contextService: ContextService;

  constructor(private readonly opts: LedgerButtonCoreOptions) {
    this.container = createContainer(this.opts);
    const loggerFactory = this.container.get<Factory<LoggerPublisher>>(
      loggerModuleTypes.LoggerPublisher,
    );
    this._logger = loggerFactory("[Ledger Button Core]");
    this._modalService = this.container.get<ModalService>(
      modalModuleTypes.ModalService,
    );
    this._contextService = this.container.get<ContextService>(
      contextModuleTypes.ContextService,
    );
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

    this._contextService.onEvent({
      type: "initialize_context",
      context: {
        connectedDevice: undefined,
        selectedAccount: isTrustChainValid ? selectedAccount : undefined,
        trustChainId: isTrustChainValid ? trustChainId : undefined,
        applicationPath: undefined,
        chainId: selectedAccount
          ? getChainIdFromCurrencyId(selectedAccount.currencyId)
          : 1,
      },
    });
  }

  private listenDevice() {
    const deviceService = this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    );
    const dmk = deviceService.dmk;
    const sessionId = deviceService.connectedDevice?.sessionId;

    if (!sessionId) {
      return;
    }

    dmk
      .getDeviceSessionState({
        sessionId: sessionId as string,
      })
      .subscribe((state) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this._logger.info("Device disconnected");

          this._contextService.onEvent({
            type: "device_disconnected",
          });
        }
      });
  }

  async disconnect() {
    this._logger.debug("Disconnecting from device");
    await this.disconnectFromDevice();
    this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .resetStorage();

    this._contextService.onEvent({
      type: "wallet_disconnected",
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

    //Track open session event, every user interaction with the app should start with a device connection intent
    await this.container
      .get<TrackOpenSession>(eventTrackingModuleTypes.TrackOpenSession)
      .execute();

    const device = await this.container
      .get<ConnectDevice>(deviceModuleTypes.ConnectDeviceUseCase)
      .execute({ type });

    this._contextService.onEvent({
      type: "device_connected",
      device: device,
    });

    this.listenDevice();
    return device;
  }

  async disconnectFromDevice() {
    this._logger.debug("Disconnecting from device");
    const result = await this.container
      .get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
      .execute();

    this._contextService.onEvent({
      type: "device_disconnected",
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

    //SHOULD ALWAYS BE TRUE when use here.
    if (selectedAccount) {
      this._contextService.onEvent({
        type: "account_changed",
        account: selectedAccount,
      });

      this.container
        .get<TrackOnboarding>(eventTrackingModuleTypes.TrackOnboarding)
        .execute(selectedAccount);
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
  ): Observable<SignFlowStatus> {
    this._logger.debug("Signing transaction", { params });
    return this.container
      ?.get<TransactionService>(transactionModuleTypes.TransactionService)
      .sign(params);
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

  setPendingAccountAddress(address: string | undefined) {
    this._logger.debug("Setting pending account address", { address });
    this._pendingAccountAddress = address;
  }

  getPendingAccountAddress(): string | undefined {
    this._logger.debug("Getting pending account address");

    return this._pendingAccountAddress;
  }

  clearPendingAccountAddress() {
    this._logger.debug("Clearing pending account address");
    this._pendingAccountAddress = undefined;
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

    this.container
      .get<TrackLedgerSyncOpened>(
        eventTrackingModuleTypes.TrackLedgerSyncOpened,
      )
      .execute();

    const res = this.container
      .get<LedgerSyncService>(ledgerSyncModuleTypes.LedgerSyncService)
      .authenticate();

    return res.pipe(
      tap(async (res: LedgerSyncAuthenticateResponse) => {
        if (!this.isAuthContext(res)) return;

        this._contextService.onEvent({
          type: "trustchain_connected",
          trustChainId: res.trustChainId,
          applicationPath: res.applicationPath,
        });

        //TODO move inside context service onEvent
        await this.container
          .get<TrackLedgerSyncActivated>(
            eventTrackingModuleTypes.TrackLedgerSyncActivated,
          )
          .execute(res.trustChainId);
      }),
    );
  }

  private isAuthContext(
    res: LedgerSyncAuthenticateResponse,
  ): res is AuthContext {
    return "trustChainId" in res && "applicationPath" in res;
  }

  observeContext(): Observable<ButtonCoreContext> {
    return this._contextService.observeContext();
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

  setChainId(chainId: number) {
    this._contextService.onEvent({
      type: "chain_changed",
      chainId,
    });
  }
}

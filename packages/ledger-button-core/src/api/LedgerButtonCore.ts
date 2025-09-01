import { Container, Factory } from "inversify";
import { BehaviorSubject, Observable, tap } from "rxjs";

import { ButtonCoreContext } from "./model/ButtonCoreContext.js";
import {
  AuthContext,
  LedgerSyncAuthenticateResponse,
} from "./model/LedgerSyncAuthenticateResponse.js";
import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { type AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccountsUseCase } from "../internal/account/use-case/fetchAccountsUseCase.js";
import { backendModuleTypes } from "../internal/backend/backendModuleTypes.js";
import { type BackendService } from "../internal/backend/BackendService.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import {
  type ConnectionType,
  type DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import { ListAvailableDevices } from "../internal/device/use-case/ListAvailableDevices.js";
import { SignRawTransactionParams } from "../internal/device/use-case/SignRawTransaction.js";
import { type SignTransactionParams } from "../internal/device/use-case/SignTransaction.js";
import { type SignTypedDataParams } from "../internal/device/use-case/SignTypedData.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { type ContainerOptions } from "../internal/diTypes.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/ledgerSyncModuleTypes.js";
import { LedgerSyncService } from "../internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../internal/logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../internal/logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { type StorageService } from "../internal/storage/StorageService.js";
import { type TransactionService } from "../internal/transaction/service/TransactionService.js";
import { TransactionResult } from "../internal/transaction/service/TransactionService.js";
import { transactionModuleTypes } from "../internal/transaction/transactionModuleTypes.js";
import { type JSONRPCRequest } from "../internal/web3-provider/model/EIPTypes.js";
import { JSONRPCCallUseCase } from "../internal/web3-provider/use-case/JSONRPCRequest.js";
import { web3ProviderModuleTypes } from "../internal/web3-provider/web3ProviderModuleTypes.js";

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

  constructor(private readonly opts: ContainerOptions) {
    this.container = createContainer(this.opts);
    const loggerFactory = this.container.get<Factory<LoggerPublisher>>(
      loggerModuleTypes.LoggerPublisher,
    );
    this._logger = loggerFactory("[Ledger Button Core]");
    this.initializeContext();
  }

  private async initializeContext() {
    this._logger.debug("Initializing context");

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

    // Restore context
    this._currentContext.next({
      connectedDevice: undefined,
      selectedAccount: selectedAccount,
      trustChainId: trustChainId,
      applicationPath: undefined,
    });
  }

  async disconnect() {
    this._logger.debug("Disconnecting from device");
    this.disconnectFromDevice();
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

    if (selectedAccount) {
      this._logger.debug("Saving selected account", { selectedAccount });
      this.container
        .get<StorageService>(storageModuleTypes.StorageService)
        .saveSelectedAccount(selectedAccount);
    }

    this._currentContext.next({
      connectedDevice: this._currentContext.value.connectedDevice,
      selectedAccount: selectedAccount ?? undefined,
      trustChainId: this._currentContext.value.trustChainId,
      applicationPath: this._currentContext.value.applicationPath,
    });
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
      | SignTypedDataParams,
  ): Observable<TransactionResult> {
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
    const res = this.container
      .get<LedgerSyncService>(ledgerSyncModuleTypes.LedgerSyncService)
      .authenticate();

    return res.pipe(
      tap((res: LedgerSyncAuthenticateResponse) => {
        if ((<AuthContext>res).trustChainId !== undefined) {
          this._currentContext.next({
            connectedDevice: this._currentContext.value.connectedDevice,
            selectedAccount: this._currentContext.value.selectedAccount,
            trustChainId: (<AuthContext>res).trustChainId,
            applicationPath: (<AuthContext>res).applicationPath,
          });
        }
      }),
    );
  }

  observeContext(): Observable<ButtonCoreContext> {
    return this._currentContext.asObservable();
  }
}

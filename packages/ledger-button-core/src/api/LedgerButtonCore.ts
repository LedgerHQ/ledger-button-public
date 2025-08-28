import { Container } from "inversify";
import { BehaviorSubject, Observable, tap } from "rxjs";

import { ButtonCoreContext } from "./model/ButtonCoreContext.js";
import {
  AuthContext,
  LedgerSyncAuthenticateResponse,
} from "./model/LedgerSyncAuthenticateResponse.js";
import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { type AccountService } from "../internal/account/service/AccountService.js";
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
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { type StorageService } from "../internal/storage/StorageService.js";
import { type TransactionService } from "../internal/transaction/service/TransactionService.js";
import { TransactionResult } from "../internal/transaction/service/TransactionService.js";
import { transactionModuleTypes } from "../internal/transaction/transactionModuleTypes.js";
import { FetchAccountsUseCase } from "../internal/usecases/fetchAccountsUseCase.js";
import { usecasesModuleTypes } from "../internal/usecases/usecasesModuleTypes.js";
import { type JSONRPCRequest } from "../internal/web3-provider/model/EIPTypes.js";
import { JSONRPCCallUseCase } from "../internal/web3-provider/use-case/JSONRPCRequest.js";
import { web3ProviderModuleTypes } from "../internal/web3-provider/web3ProviderModuleTypes.js";

export class LedgerButtonCore {
  private container!: Container;
  private _pendingTransactionParams?:
    | SignRawTransactionParams
    | SignTransactionParams;

  private _currentContext: BehaviorSubject<ButtonCoreContext> =
    new BehaviorSubject<ButtonCoreContext>({
      connectedDevice: undefined,
      selectedAccount: undefined,
      trustChainId: undefined,
      applicationPath: undefined,
    });

  constructor(private readonly opts: ContainerOptions) {
    this.container = createContainer(this.opts);
    this.initializeContext();
  }

  private async initializeContext() {
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

    console.log("trustChainId in context", trustChainId);
    console.log("selectedAccount in context", selectedAccount);

    // Restore context
    this._currentContext.next({
      connectedDevice: undefined,
      selectedAccount: selectedAccount,
      trustChainId: trustChainId,
      applicationPath: undefined,
    });
  }

  async disconnect() {
    console.log("[Ledger Button Core] Disconnect()");
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
      console.error("Error unbinding container", error);
    } finally {
      this.container = createContainer(this.opts);
    }
  }

  // Device methods
  async connectToDevice(type: ConnectionType) {
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
    const result = this.container
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
    return this.container
      .get<SwitchDevice>(deviceModuleTypes.SwitchDeviceUseCase)
      .execute({ type });
  }

  // Account methods
  async fetchAccounts() {
    return this.container
      .get<FetchAccountsUseCase>(usecasesModuleTypes.FetchAccountsUseCase)
      .execute();
  }

  getAccounts() {
    return this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getAccounts();
  }

  selectAccount(address: string) {
    console.log("[Ledger Button Core] Select account", address);

    this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .selectAccount(address);

    const selectedAccount = this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getSelectedAccount();

    if (selectedAccount) {
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
    return this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getSelectedAccount()
      .extract();
  }

  // Device methods
  getConnectedDevice() {
    return this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    ).connectedDevice;
  }

  async listAvailableDevices() {
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
    return this.container
      ?.get<TransactionService>(transactionModuleTypes.TransactionService)
      .sign(params);
  }

  setPendingTransactionParams(
    params: SignRawTransactionParams | SignTransactionParams | undefined,
  ) {
    this._pendingTransactionParams = params;
  }

  getPendingTransactionParams(): SignRawTransactionParams | undefined {
    return this._pendingTransactionParams;
  }

  getTransactionService(): TransactionService {
    return this.container.get<TransactionService>(
      transactionModuleTypes.TransactionService,
    );
  }

  async jsonRpcRequest(args: JSONRPCRequest) {
    return this.container
      .get<JSONRPCCallUseCase>(web3ProviderModuleTypes.JSONRPCCallUseCase)
      .execute(args);
  }

  getBackendService(): BackendService {
    return this.container.get<BackendService>(
      backendModuleTypes.BackendService,
    );
  }

  connectToLedgerSync(): Observable<LedgerSyncAuthenticateResponse> {
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

import { Container } from "inversify";
import { Observable } from "rxjs";

import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { type AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccounts } from "../internal/account/use-case/FetchAccounts.js";
import { alpacaModuleTypes } from "../internal/alpaca/alpacaModuleTypes.js";
import { type AlpacaBalanceRequest } from "../internal/alpaca/model/types.js";
import { type AlpacaService } from "../internal/alpaca/service/AlpacaService.js";
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
import { type SignRawTransactionParams } from "../internal/device/use-case/SignRawTransaction.js";
import { type SignTransactionParams } from "../internal/device/use-case/SignTransaction.js";
import { type SignTypedDataParams } from "../internal/device/use-case/SignTypedData.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { type ContainerOptions } from "../internal/diTypes.js";
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
  private _pendingTransactionParams?: SignRawTransactionParams;

  constructor(private readonly opts: ContainerOptions) {
    this.container = createContainer(this.opts);
  }

  async disconnect() {
    this.disconnectFromDevice();
    this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .resetLedgerButtonStorage();
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
    return this.container
      .get<ConnectDevice>(deviceModuleTypes.ConnectDeviceUseCase)
      .execute({ type });
  }

  async disconnectFromDevice() {
    return this.container
      .get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
      .execute();
  }

  async switchDevice(type: ConnectionType) {
    return this.container
      .get<SwitchDevice>(deviceModuleTypes.SwitchDeviceUseCase)
      .execute({ type });
  }

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

  // Account methods
  async fetchAccounts() {
    return this.container
      .get<FetchAccounts>(accountModuleTypes.FetchAccountsUseCase)
      .execute();
  }

  getAccounts() {
    return this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getAccounts();
  }

  selectAccount(address: string) {
    return this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .selectAccount(address);
  }

  getSelectedAccount() {
    return this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .getSelectedAccount();
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

  setPendingTransactionParams(params: SignRawTransactionParams | undefined) {
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

  // Coin methods
  async getBalance(request: AlpacaBalanceRequest) {
    return this.container
      .get<AlpacaService>(alpacaModuleTypes.AlpacaService)
      .getBalance(request);
  }
}

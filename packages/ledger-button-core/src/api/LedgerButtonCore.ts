import { Container } from "inversify";

import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccounts } from "../internal/account/use-case/FetchAccounts.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import {
  ConnectionType,
  DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import { ListAvailableDevices } from "../internal/device/use-case/ListAvailableDevices.js";
import {
  SignTransaction,
  SignTransactionParams,
} from "../internal/device/use-case/SignTransaction.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { ContainerOptions } from "../internal/diTypes.js";
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { StorageService } from "../internal/storage/StorageService.js";

export class LedgerButtonCore {
  private container!: Container;
  private _pendingTransactionParams?: SignTransactionParams;

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
  async signTransaction(params: SignTransactionParams) {
    return this.container
      ?.get<SignTransaction>(deviceModuleTypes.SignTransactionUseCase)
      .execute(params);
  }

  setPendingTransactionParams(params: SignTransactionParams | undefined) {
    this._pendingTransactionParams = params;
  }

  getPendingTransactionParams(): SignTransactionParams | undefined {
    return this._pendingTransactionParams;
  }
}

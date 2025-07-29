import { Container } from "inversify";

import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { AccountService } from "../internal/account/service/AccountService.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import {
  ConnectionType,
  DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import {
  SignTransaction,
  SignTransactionParams,
} from "../internal/device/use-case/SignTransactionOld.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { ContainerOptions } from "../internal/diTypes.js";

export class LedgerButtonCore {
  private container: Container | null = null;

  constructor(private readonly opts: ContainerOptions) {
    this.init();
  }

  private async init() {
    if (!this.container) {
      this.container = await createContainer(this.opts);
    }
  }

  async connectToDevice(type: ConnectionType) {
    await this.init();
    return this.container
      ?.get<ConnectDevice>(deviceModuleTypes.ConnectDeviceUseCase)
      .execute({ type });
  }

  async disconnectFromDevice() {
    await this.init();
    return this.container
      ?.get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
      .execute();
  }

  async switchDevice(type: ConnectionType) {
    await this.init();
    return this.container
      ?.get<SwitchDevice>(deviceModuleTypes.SwitchDeviceUseCase)
      .execute({ type });
  }

  async fetchAccounts() {
    await this.init();
    return this.container
      ?.get<AccountService>(accountModuleTypes.AccountService)
      .fetchAccounts();
  }

  async getAccounts() {
    await this.init();
    return this.container
      ?.get<AccountService>(accountModuleTypes.AccountService)
      .getAccounts();
  }

  async getConnectedDevice() {
    await this.init();
    return this.container?.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    ).connectedDevice;
  }

  async signTransaction(params: SignTransactionParams) {
    await this.init();
    return this.container
      ?.get<SignTransaction>(deviceModuleTypes.SignTransactionUseCase)
      .execute(params);
  }
}

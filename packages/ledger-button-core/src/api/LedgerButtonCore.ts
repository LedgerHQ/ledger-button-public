import { Container } from "inversify";
import { FetchAccounts } from "src/internal/account/use-case/FetchAccounts.js";

import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import {
  ConnectionType,
  DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import {
  SignTransaction,
  TransactionData,
} from "../internal/device/use-case/SignTransaction.js";
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
      ?.get<FetchAccounts>(accountModuleTypes.FetchAccountsUseCase)
      .execute();
  }

  async getConnectedDevice() {
    await this.init();
    return this.container?.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    ).connectedDevice;
  }

  async signTransaction(transactionData: TransactionData) {
    await this.init();
    return this.container
      ?.get<SignTransaction>(deviceModuleTypes.SignTransactionUseCase)
      .execute(transactionData);
  }
}

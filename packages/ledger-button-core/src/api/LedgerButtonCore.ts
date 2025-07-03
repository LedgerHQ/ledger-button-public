import { Container } from "inversify";

import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import { AccountService } from "../internal/account/service/AccountService.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import { ConnectionType } from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { ContainerOptions } from "../internal/diTypes.js";

export class LedgerButtonCore {
  private container: Container | null = null;

  constructor(private readonly opts: ContainerOptions) {}

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
}

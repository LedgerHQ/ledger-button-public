import { type ContextModuleChainID } from "@ledgerhq/context-module";
import {
  type SignerEth,
  SignerEthBuilder,
} from "@ledgerhq/device-signer-kit-ethereum";
import { inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { evmProviderModuleTypes } from "../evmProviderModuleTypes.js";
import { BuildContextModule } from "./BuildContextModule.js";

export type BuildEthSignerParams = {
  sessionId: string;
  chain: ContextModuleChainID;
};

@injectable()
export class BuildEthSigner {
  constructor(
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(evmProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildContextModule,
  ) {}

  execute({ sessionId, chain }: BuildEthSignerParams): SignerEth {
    const contextModule = this.buildContextModule.execute({ chain });

    return new SignerEthBuilder({
      dmk: this.deviceManagementKitService.dmk,
      originToken: this.config.originToken,
      sessionId,
    })
      .withContextModule(contextModule)
      .build();
  }
}

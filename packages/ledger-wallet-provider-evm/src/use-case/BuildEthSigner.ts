import { type ContextModuleChainID } from "@ledgerhq/context-module";
import {
  type SignerEth,
  SignerEthBuilder,
} from "@ledgerhq/device-signer-kit-ethereum";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";

import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes.js";
import { BuildContextModule } from "./BuildContextModule.js";

export type BuildEthSignerParams = {
  sessionId: string;
  chain: ContextModuleChainID;
};

@injectable()
export class BuildEthSigner {
  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildContextModule,
  ) {}

  execute({ sessionId, chain }: BuildEthSignerParams): SignerEth {
    const contextModule = this.buildContextModule.execute({ chain });

    return new SignerEthBuilder({
      dmk: this.core.getDeviceSession().dmk,
      originToken: this.core.getSdkConfig().originToken,
      sessionId,
    })
      .withContextModule(contextModule)
      .build();
  }
}

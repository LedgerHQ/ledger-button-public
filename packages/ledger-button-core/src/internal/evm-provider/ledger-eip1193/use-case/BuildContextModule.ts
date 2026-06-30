import {
  type ContextModule,
  ContextModuleBuilder,
  type ContextModuleChainID,
} from "@ledgerhq/context-module";
import { inject, injectable } from "inversify";

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";

export type BuildContextModuleParams = {
  chain: ContextModuleChainID;
};

@injectable()
export class BuildContextModule {
  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
  ) {}

  execute({ chain }: BuildContextModuleParams): ContextModule {
    const { originToken, dAppIdentifier } = this.core.getSdkConfig();
    return new ContextModuleBuilder({
      originToken,
    })
      .setAppSource(dAppIdentifier)
      .setChain(chain)
      .build();
  }
}

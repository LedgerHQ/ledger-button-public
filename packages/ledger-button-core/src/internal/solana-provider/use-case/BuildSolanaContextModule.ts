import {
  type ContextModule,
  ContextModuleBuilder,
  ContextModuleChainID,
} from "@ledgerhq/context-module";
import { inject, injectable } from "inversify";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import { solanaProviderModuleTypes } from "../di/solanaProviderModuleTypes.js";

@injectable()
export class BuildSolanaContextModule {
  constructor(
    @inject(solanaProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
  ) {}

  execute(): ContextModule {
    const { originToken, dAppIdentifier } = this.core.getSdkConfig();
    return new ContextModuleBuilder({
      originToken,
    })
      .setAppSource(dAppIdentifier)
      .setChain(ContextModuleChainID.Solana)
      .build();
  }
}

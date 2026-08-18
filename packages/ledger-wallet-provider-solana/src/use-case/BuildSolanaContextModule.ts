import {
  type ContextModule,
  ContextModuleBuilder,
  ContextModuleChainID,
} from "@ledgerhq/context-module";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";

import { solanaProviderModuleTypes } from "../di/solanaProviderModuleTypes";

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

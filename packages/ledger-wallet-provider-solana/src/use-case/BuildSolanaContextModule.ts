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
    const { originToken, dAppIdentifier, clearSigningEndpoints } =
      this.core.getSdkConfig();
    const builder = new ContextModuleBuilder({
      originToken,
    }).setAppSource(dAppIdentifier);

    if (clearSigningEndpoints) {
      builder
        .setCalConfig({
          url: clearSigningEndpoints.calUrl,
          mode: "prod",
          branch: "main",
        })
        .setWeb3ChecksConfig({
          url: clearSigningEndpoints.transactionCheckUrl,
        });
    }

    return builder.setChain(ContextModuleChainID.Solana).build();
  }
}

import {
  type ContextModule,
  ContextModuleBuilder,
  ContextModuleChainID,
} from "@ledgerhq/context-module";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";

import { xrpProviderModuleTypes } from "../di/xrpProviderModuleTypes";

@injectable()
export class BuildXrpContextModule {
  constructor(
    @inject(xrpProviderModuleTypes.CoreFacade)
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

    return builder.setChain(ContextModuleChainID.Xrp).build();
  }
}

import {
  type ContextModule,
  ContextModuleBuilder,
  type ContextModuleChainID,
} from "@ledgerhq/context-module";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";

import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes";

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

    return builder.setChain(chain).build();
  }
}

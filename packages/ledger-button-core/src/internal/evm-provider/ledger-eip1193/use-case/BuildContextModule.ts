import {
  type ContextModule,
  ContextModuleBuilder,
  type ContextModuleChainID,
} from "@ledgerhq/context-module";
import { inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";

export type BuildContextModuleParams = {
  chain: ContextModuleChainID;
};

@injectable()
export class BuildContextModule {
  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  execute({ chain }: BuildContextModuleParams): ContextModule {
    return new ContextModuleBuilder({
      originToken: this.config.originToken,
    })
      .setAppSource(this.config.dAppIdentifier)
      .setChain(chain)
      .build();
  }
}

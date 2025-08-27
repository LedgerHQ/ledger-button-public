import { inject, injectable } from "inversify";
import { EitherAsync, Left } from "purify-ts";

import { configModuleTypes } from "../config/configModuleTypes.js";
import { Config } from "../config/model/config.js";
import { DAppConfigService } from "./DAppConfigService.js";

@injectable()
export class DefaultDAppConfigService implements DAppConfigService {
  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    // @inject(backendModuleTypes.BackendService)
    // private readonly networkService: BackendService,
  ) {}

  get() {
    console.log(this.config.dAppIdentifier);
    return EitherAsync.liftEither(Left(new Error("Not implemented")));
  }
}

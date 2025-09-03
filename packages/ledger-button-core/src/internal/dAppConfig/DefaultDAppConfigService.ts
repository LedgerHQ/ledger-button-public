import { inject, injectable } from "inversify";
import { EitherAsync } from "purify-ts";

import { backendModuleTypes } from "../backend/backendModuleTypes.js";
import { type BackendService } from "../backend/BackendService.js";
import { configModuleTypes } from "../config/configModuleTypes.js";
import { Config } from "../config/model/config.js";
import { DAppConfigService } from "./DAppConfigService.js";
import { DAppConfig } from "./types.js";

@injectable()
export class DefaultDAppConfigService implements DAppConfigService {
  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
  ) {}

  get<K extends keyof DAppConfig>(key: K) {
    const dAppIdentifier = this.config.dAppIdentifier;

    return EitherAsync.fromPromise(() =>
      this.backendService.getConfig({ dAppIdentifier }),
    ).map((config) => config[key]);
  }
}

import { inject, injectable } from "inversify";

import { type BackendService } from "@internal/backend/BackendService";
import { backendModuleTypes } from "@internal/backend/di/backendModuleTypes";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";

import { mapConfigResponseToDAppConfig } from "../mapper/mapConfigResponseToDAppConfig";
import { DAppConfig } from "../model/dAppConfigTypes";
import { DAppConfigDataSource } from "./DAppConfigDataSource";

@injectable()
export class DefaultDAppConfigDataSource implements DAppConfigDataSource {
  private dAppConfig: DAppConfig | null = null;

  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
  ) {}

  async getDAppConfig(): Promise<DAppConfig> {
    if (this.dAppConfig) {
      return this.dAppConfig;
    }

    const dAppIdentifier = this.config.dAppIdentifier;
    const config = await this.backendService.getConfigV2({ dAppIdentifier });

    if (!config.isRight()) {
      throw new Error("Failed to get DApp config V2");
    }

    this.dAppConfig = mapConfigResponseToDAppConfig(config.extract());

    return this.dAppConfig;
  }
}

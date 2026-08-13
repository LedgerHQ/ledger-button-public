import { inject, injectable } from "inversify";

import { type BackendService } from "@internal/backend/BackendService.js";
import { backendModuleTypes } from "@internal/backend/di/backendModuleTypes.js";
import { configModuleTypes } from "@internal/config/di/configModuleTypes.js";
import { Config } from "@internal/config/model/config.js";

import { DAppConfig } from "../model/dAppConfigTypes.js";
import { DAppConfigDataSource } from "./DAppConfigDataSource.js";

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
    // Hits the /v2/config endpoint. For now this default is unused at runtime
    // (DI wires StubDAppConfigDataSource).
    const config = await this.backendService.getConfigV2({ dAppIdentifier });

    if (config.isLeft()) {
      throw new Error("Failed to get DApp config V2");
    }

    // TODO: map the backend response to the DAppConfig shape once the
    // /v2/config response contract is confirmed.
    throw new Error("DefaultDAppConfigDataSource not yet implemented");
  }
}

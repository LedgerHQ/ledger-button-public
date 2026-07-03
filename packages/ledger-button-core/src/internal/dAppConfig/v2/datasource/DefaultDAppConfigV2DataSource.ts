import { inject, injectable } from "inversify";

import { backendModuleTypes } from "../../../backend/backendModuleTypes.js";
import { type BackendService } from "../../../backend/BackendService.js";
import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import { DAppConfigV2 } from "../model/dAppConfigV2Types.js";
import { DAppConfigV2DataSource } from "./DAppConfigV2DataSource.js";

@injectable()
export class DefaultDAppConfigV2DataSource implements DAppConfigV2DataSource {
  private dAppConfigV2: DAppConfigV2 | null = null;

  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
  ) {}

  async getDAppConfig(): Promise<DAppConfigV2> {
    if (this.dAppConfigV2) {
      return this.dAppConfigV2;
    }

    const dAppIdentifier = this.config.dAppIdentifier;
    // TODO: switch to a v2-aware backend call (e.g. backendService.getConfigV2)
    // once the v2 endpoint is available. For now this default is unused at
    // runtime (DI wires StubDAppConfigV2DataSource) and the call below remains
    // as a structural placeholder mirroring DefaultDAppConfigService.
    const config = await this.backendService.getConfig({ dAppIdentifier });

    if (config.isLeft()) {
      throw new Error("Failed to get DApp config V2");
    }

    // TODO: map the v1 ConfigResponse to the v2 DAppConfigV2 shape once the
    // backend exposes the v2 endpoint.
    throw new Error("DefaultDAppConfigV2DataSource not yet implemented");
  }
}

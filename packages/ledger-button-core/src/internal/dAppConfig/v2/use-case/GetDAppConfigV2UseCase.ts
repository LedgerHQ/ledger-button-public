import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import type { DAppConfigV2DataSource } from "../datasource/DAppConfigV2DataSource.js";
import { dAppConfigV2ModuleTypes } from "../di/dAppConfigV2ModuleTypes.js";
import { DAppConfigV2 } from "../model/dAppConfigV2Types.js";

@injectable()
export class GetDAppConfigV2UseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(dAppConfigV2ModuleTypes.DAppConfigV2DataSource)
    private readonly dataSource: DAppConfigV2DataSource,
  ) {
    this.logger = loggerFactory("GetDAppConfigV2UseCase");
  }

  async execute(): Promise<DAppConfigV2> {
    this.logger.debug("Fetching dApp config V2");

    try {
      return await this.dataSource.getDAppConfig();
    } catch (error) {
      this.logger.error("Failed to fetch dApp config V2", { error });
      throw error;
    }
  }
}

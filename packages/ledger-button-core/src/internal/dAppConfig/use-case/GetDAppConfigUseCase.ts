import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { DAppConfigDataSource } from "../datasource/DAppConfigDataSource.js";
import { dAppConfigModuleTypes } from "../dAppConfigModuleTypes.js";
import { DAppConfig } from "../model/dAppConfigTypes.js";

@injectable()
export class GetDAppConfigUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(dAppConfigModuleTypes.DAppConfigDataSource)
    private readonly dataSource: DAppConfigDataSource,
  ) {
    this.logger = loggerFactory("GetDAppConfigUseCase");
  }

  async execute(): Promise<DAppConfig> {
    this.logger.debug("Fetching dApp config");

    try {
      return await this.dataSource.getDAppConfig();
    } catch (error) {
      this.logger.error("Failed to fetch dApp config", { error });
      throw error;
    }
  }
}

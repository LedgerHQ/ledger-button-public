import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { DAppConfigDataSource } from "../datasource/DAppConfigDataSource";
import { dAppConfigModuleTypes } from "../di/dAppConfigModuleTypes";
import { DAppConfig } from "../model/dAppConfigTypes";

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

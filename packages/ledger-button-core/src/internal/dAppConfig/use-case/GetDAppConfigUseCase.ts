import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { storageModuleTypes } from "@internal/storage/di/storageModuleTypes";
import type { StorageService } from "@internal/storage/StorageService";

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
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {
    this.logger = loggerFactory("GetDAppConfigUseCase");
  }

  async execute(): Promise<DAppConfig> {
    this.logger.debug("Fetching dApp config");

    try {
      const config = await this.dataSource.getDAppConfig();
      return this.mergeNetworkOverrides(config);
    } catch (error) {
      this.logger.error("Failed to fetch dApp config", { error });
      throw error;
    }
  }

  private mergeNetworkOverrides(config: DAppConfig): DAppConfig {
    const { networkOverrides } = this.storageService.getConfigOverrides();

    if (Object.keys(networkOverrides).length === 0) {
      return config;
    }

    return {
      ...config,
      blockchains: config.blockchains.map((blockchain) => ({
        ...blockchain,
        networks: [
          ...blockchain.networks,
          ...(networkOverrides[blockchain.blockchain] ?? []),
        ],
      })),
    };
  }
}

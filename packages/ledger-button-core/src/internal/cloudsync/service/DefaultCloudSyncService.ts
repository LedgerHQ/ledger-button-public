import { type Factory, inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { InternalAuthContext } from "../../ledgersync/model/InternalAuthContext.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import { type NetworkService } from "../../network/NetworkService.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import { CloudSyncData } from "../model/cloudSyncTypes.js";
import { CloudSyncService } from "./CloudSyncService.js";

const CLOUD_SYNC_BASE_URL_STG =
  "https://cloud-sync-backend.api.aws.stg.ldg-tech.com";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLOUD_SYNC_BASE_URL_PROD =
  "https://cloud-sync-backend.api.aws.prod.ldg-tech.com";

@injectable()
export class DefaultCloudSyncService implements CloudSyncService {
  private readonly logger: any;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<RequestInit>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {
    this.logger = loggerFactory("[Cloud Sync Service]");
  }

  async fetchEncryptedAccounts(
    authContext: InternalAuthContext,
  ): Promise<CloudSyncData> {
    // TODO: Get version from storage
    const params = new URLSearchParams({
      path: authContext.applicationPath,
      id: authContext.trustChainId,
      version: "0",
    });

    const response: Either<Error, CloudSyncData> =
      await this.networkService.get<CloudSyncData>(
        `${CLOUD_SYNC_BASE_URL_STG}/atomic/v1/live?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authContext.jwt.access_token}`,
            "x-ledger-client-version": "ll-web-tools/0.0.0",
          },
        },
      );

    return response.orDefaultLazy(() => {
      this.logger.error("Failed to fetch encrypted accounts");
      throw new Error("Failed to fetch encrypted accounts");
    });
  }
}

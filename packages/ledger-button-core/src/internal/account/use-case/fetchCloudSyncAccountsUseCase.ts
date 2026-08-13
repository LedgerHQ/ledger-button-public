import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";

import { base64ToArrayBuffer } from "@api/utils/base64Utils.js";
import { cloudSyncModuleTypes } from "@internal/cloudsync/di/cloudSyncModuleTypes.js";
import type { CloudSyncService } from "@internal/cloudsync/service/CloudSyncService.js";
import { ledgerSyncModuleTypes } from "@internal/ledgersync/di/ledgerSyncModuleTypes.js";
import { LedgerSyncAuthContextMissingError } from "@internal/ledgersync/model/errors.js";
import type { InternalAuthContext } from "@internal/ledgersync/model/InternalAuthContext.js";
import type { LedgerSyncService } from "@internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

import type { CloudSyncData } from "../service/AccountService.js";

@injectable()
export class FetchCloudSyncAccountsUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(ledgerSyncModuleTypes.LedgerSyncService)
    private readonly ledgerSyncService: LedgerSyncService,
    @inject(cloudSyncModuleTypes.CloudSyncService)
    private readonly cloudSyncService: CloudSyncService,
  ) {
    this.logger = loggerFactory("FetchCloudSyncAccountsUseCase");
  }

  async execute(): Promise<CloudSyncData> {
    await this.authenticateWithKeyPair();
    const authContext = this.getAuthContextOrThrow();
    const accounts = await this.fetchAndDecryptAccounts(authContext);

    this.logger.info("Accounts fetched from cloud sync", accounts);
    return accounts;
  }

  private getAuthContextOrThrow(): InternalAuthContext {
    const authContext = this.ledgerSyncService.authContext;
    if (!authContext) {
      const error = new LedgerSyncAuthContextMissingError(
        "No auth context available",
      );
      this.logger.error("Missing auth context for fetching accounts", {
        error,
      });
      throw error;
    }
    return authContext;
  }

  private async authenticateWithKeyPair(): Promise<void> {
    await lastValueFrom(this.ledgerSyncService.authenticate());
  }

  private async fetchAndDecryptAccounts(
    authContext: InternalAuthContext,
  ): Promise<CloudSyncData> {
    const cloudSyncData =
      await this.cloudSyncService.fetchEncryptedAccounts(authContext);
    const payload = base64ToArrayBuffer(cloudSyncData.payload);
    const accountsData = await this.ledgerSyncService.decrypt(payload);

    return JSON.parse(new TextDecoder().decode(accountsData));
  }
}

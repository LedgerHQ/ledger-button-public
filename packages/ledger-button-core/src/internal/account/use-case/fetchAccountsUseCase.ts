import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";

import { base64ToArrayBuffer } from "../../../api/utils/base64Utils.js";
import { cloudSyncModuleTypes } from "../../cloudsync/cloudSyncModuleTypes.js";
import type { CloudSyncService } from "../../cloudsync/service/CloudSyncService.js";
import { ledgerSyncModuleTypes } from "../../ledgersync/ledgerSyncModuleTypes.js";
import { LedgerSyncAuthContextMissingError } from "../../ledgersync/model/errors.js";
import type { LedgerSyncService } from "../../ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type {
  AccountService,
  CloudSyncData,
} from "../service/AccountService.js";
import { Account } from "../service/AccountService.js";

@injectable()
export class FetchAccountsUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(ledgerSyncModuleTypes.LedgerSyncService)
    private readonly ledgerSyncService: LedgerSyncService,
    @inject(cloudSyncModuleTypes.CloudSyncService)
    private readonly cloudSyncService: CloudSyncService,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
  ) {
    this.logger = loggerFactory("FetchAccountsUseCase");
  }

  async execute(): Promise<Account[]> {
    if (!this.ledgerSyncService.authContext) {
      throw new LedgerSyncAuthContextMissingError("No auth context available");
    }

    //Re-fetch a new JWT not using device but using the keyPair (need for getting the right JWT for cloud sync)
    await lastValueFrom(this.ledgerSyncService.authenticate());

    const cloudSyncData = await this.cloudSyncService.fetchEncryptedAccounts(
      this.ledgerSyncService.authContext,
    );
    const payload = base64ToArrayBuffer(cloudSyncData.payload);
    const accountsData = await this.ledgerSyncService.decrypt(payload);
    const accounts: CloudSyncData = JSON.parse(
      new TextDecoder().decode(accountsData),
    );
    this.logger.info("Accounts fetched from cloud sync", accounts);

    await this.accountService.setAccountsFromCloudSyncData(accounts);
    return this.accountService.getAccounts();
  }
}

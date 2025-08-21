import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";
import { Account } from "src/api/index.js";
import { bytesToString } from "viem";

import { accountModuleTypes } from "../account/accountModuleTypes.js";
import type {
  AccountService,
  CloudSyncData,
} from "../account/service/AccountService.js";
import { cloudSyncModuleTypes } from "../cloudsync/cloudSyncModuleTypes.js";
import type { CloudSyncService } from "../cloudsync/service/CloudSyncService.js";
import { ledgerSyncModuleTypes } from "../ledgersync/ledgerSyncModuleTypes.js";
import type { LedgerSyncService } from "../ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../logger/service/LoggerPublisher.js";

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
      throw new Error("No auth context available"); //TODO create Specific error o be handled by Button Screen Controller
    }

    //Re-fetch a new JWT not using device but using the keypair (need for getting the right JWT)
    await lastValueFrom(this.ledgerSyncService.authenticate());

    const cloudSyncData = await this.cloudSyncService.fetchEncryptedAccounts(
      this.ledgerSyncService.authContext,
    );
    const payload = base64ToArrayBuffer(cloudSyncData.payload);
    const accountsData = await this.ledgerSyncService.decrypt(payload);
    const accounts: CloudSyncData = JSON.parse(bytesToString(accountsData));
    this.logger.info("Accounts fetched from cloud sync", accounts);

    this.accountService.setAccountsFromCloudSyncData(accounts);
    return this.accountService.getAccounts();
  }
}

//TODO move in utils
function base64ToArrayBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

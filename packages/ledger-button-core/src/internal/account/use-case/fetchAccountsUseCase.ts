import { inject, injectable } from "inversify";

import type { Account } from "@api/model/Account";

import { accountModuleTypes } from "../di/accountModuleTypes";
import type { AccountService } from "../service/AccountService";
import { FetchCloudSyncAccountsUseCase } from "./fetchCloudSyncAccountsUseCase";

@injectable()
export class FetchAccountsUseCase {
  constructor(
    @inject(accountModuleTypes.FetchCloudSyncAccountsUseCase)
    private readonly fetchCloudSyncAccountsUseCase: FetchCloudSyncAccountsUseCase,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
  ) {}

  async execute(): Promise<Account[]> {
    const accounts = await this.fetchCloudSyncAccountsUseCase.execute();
    await this.accountService.setAccountsFromCloudSyncData(accounts);
    return this.accountService.getAccounts();
  }
}

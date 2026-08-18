import { inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { Account } from "@api/model/Account.js";
import { getActiveSelectedAccount } from "@api/model/ButtonCoreContext.js";
import type { ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";

import { accountModuleTypes } from "../di/accountModuleTypes.js";
import type { AccountService } from "../service/AccountService.js";

/**
 * Resolves the account behind a network entry: same address as the currently
 * selected account, on the given `currencyId`.
 */
@injectable()
export class FindAccountForNetworkUseCase {
  constructor(
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
  ) {}

  execute(currencyId: string): Maybe<Account> {
    const address = getActiveSelectedAccount(
      this.contextService.getContext(),
    )?.freshAddress;

    if (!address) {
      return Maybe.empty();
    }

    return Maybe.fromNullable(
      this.accountService
        .getAccounts()
        .find(
          (account) =>
            account.freshAddress === address &&
            account.currencyId === currencyId,
        ),
    );
  }
}

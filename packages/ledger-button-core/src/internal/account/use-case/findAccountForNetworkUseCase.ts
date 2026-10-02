import { inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { Account } from "@api/model/Account";
import { getActiveSelectedAccount } from "@api/model/ButtonCoreContext";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";

import { accountModuleTypes } from "../di/accountModuleTypes";
import type { AccountService } from "../service/AccountService";

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

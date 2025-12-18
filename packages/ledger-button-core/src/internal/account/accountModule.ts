import { ContainerModule } from "inversify";

import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { FetchAccountsUseCase } from "./use-case/fetchAccountsUseCase.js";
import { FetchAccountsWithBalanceUseCase } from "./use-case/fetchAccountsWithBalanceUseCase.js";
import { FetchSelectedAccountUseCase } from "./use-case/fetchSelectedAccountUseCase.js";
import { type ContainerOptions } from "../diTypes.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "loggerLevel"> & {
  stub?: boolean;
};

export function accountModuleFactory(_args: AccountModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(accountModuleTypes.AccountService)
      .to(DefaultAccountService)
      .inSingletonScope();

    bind(accountModuleTypes.FetchAccountsUseCase).to(FetchAccountsUseCase);
    bind(accountModuleTypes.FetchAccountsWithBalanceUseCase).to(
      FetchAccountsWithBalanceUseCase,
    );
    bind(accountModuleTypes.FetchSelectedAccountUseCase).to(
      FetchSelectedAccountUseCase,
    );
  });
}

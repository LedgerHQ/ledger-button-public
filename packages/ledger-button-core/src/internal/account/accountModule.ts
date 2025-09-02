import { ContainerModule } from "inversify";

import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { FetchAccountsUseCase } from "./use-case/fetchAccountsUseCase.js";
import { ContainerOptions } from "../diTypes.js";
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
  });
}

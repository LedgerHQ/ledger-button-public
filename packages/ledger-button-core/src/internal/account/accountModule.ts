import { ContainerModule } from "inversify";

import { DefaultRemoteAccountDataSource } from "./datasource/DefaultRemoteAccountDataSource.js";
import { StubRemoteAccountDataSource } from "./datasource/StubRemoteAccountDataSource.js";
import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { FetchAccounts } from "./use-case/FetchAccounts.js";
import { ContainerOptions } from "../diTypes.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "stub">;

export function accountModuleFactory({ stub }: AccountModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(accountModuleTypes.AccountService)
      .to(DefaultAccountService)
      .inSingletonScope();
    bind(accountModuleTypes.RemoteAccountDataSource).to(
      DefaultRemoteAccountDataSource,
    );

    bind(accountModuleTypes.FetchAccountsUseCase).to(FetchAccounts);

    if (stub) {
      rebindSync(accountModuleTypes.RemoteAccountDataSource).to(
        StubRemoteAccountDataSource,
      );
    }
  });
}

import { ContainerModule } from "inversify";

import { DefaultRemoteAccountDataSource } from "./datasource/DefaultRemoteAccountDataSource.js";
import { StubRemoteAccountDataSource } from "./datasource/StubRemoteAccountDataSource.js";
import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { ContainerOptions } from "../diTypes.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "stub">;

export function accountModuleFactory({ stub }: AccountModuleOptions) {
  return new ContainerModule(({ bind, rebind }) => {
    bind(accountModuleTypes.AccountService)
      .to(DefaultAccountService)
      .inSingletonScope();
    bind(accountModuleTypes.RemoteAccountDataSource).to(
      DefaultRemoteAccountDataSource,
    );

    if (stub) {
      rebind(accountModuleTypes.RemoteAccountDataSource).then((bind) =>
        bind.to(StubRemoteAccountDataSource),
      );
    }
  });
}

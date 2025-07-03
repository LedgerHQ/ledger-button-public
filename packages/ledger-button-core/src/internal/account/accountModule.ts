import { ContainerModule } from "inversify";

import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { StubDefaultAccountService } from "./service/StubDefaultAccountService.js";
import { ContainerOptions } from "../diTypes.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "stub">;

export function accountModuleFactory({ stub }: AccountModuleOptions) {
  return new ContainerModule(({ bind, rebind }) => {
    bind(accountModuleTypes.AccountService).to(DefaultAccountService);

    if (stub) {
      rebind(accountModuleTypes.AccountService).then((bind) =>
        bind.to(StubDefaultAccountService),
      );
    }
  });
}

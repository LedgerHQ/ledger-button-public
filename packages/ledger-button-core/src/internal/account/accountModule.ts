import { ContainerModule } from "inversify";

import { DefaultAccountService } from "./service/DefaultAccountService.js";
import { ContainerOptions } from "../diTypes.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "stub">;

export function accountModuleFactory({ stub }: AccountModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(accountModuleTypes.AccountService)
      .to(DefaultAccountService)
      .inSingletonScope();
  });
}

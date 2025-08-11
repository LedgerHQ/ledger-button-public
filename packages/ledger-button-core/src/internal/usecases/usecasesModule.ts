import { ContainerModule } from "inversify";

import { ContainerOptions } from "../diTypes.js";
import { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import { usecasesModuleTypes } from "./usecasesModuleTypes.js";

type UsecasesOptions = Pick<ContainerOptions, "stub">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usecasesModuleFactory({ stub }: UsecasesOptions) {
  return new ContainerModule(({ bind }) => {
    bind(usecasesModuleTypes.FetchAccountsUseCase)
      .to(FetchAccountsUseCase)
      .inSingletonScope();
  });
}

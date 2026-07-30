import { ContainerModule } from "inversify";

import { DAppConfigDataSource } from "./datasource/DAppConfigDataSource.js";
import { StubDAppConfigDataSource } from "./datasource/StubDAppConfigDataSource.js";
import { GetDAppConfigUseCase } from "./use-case/GetDAppConfigUseCase.js";
import { dAppConfigModuleTypes } from "./dAppConfigModuleTypes.js";

export function dAppConfigModuleFactory() {
  return new ContainerModule(({ bind }) => {
    // Only a stub data source exists for now (hardcoded values).
    // When a real backend implementation lands, swap this to the default
    // implementation.
    bind<DAppConfigDataSource>(dAppConfigModuleTypes.DAppConfigDataSource)
      .to(StubDAppConfigDataSource)
      .inSingletonScope();

    bind<GetDAppConfigUseCase>(dAppConfigModuleTypes.GetDAppConfigUseCase)
      .to(GetDAppConfigUseCase)
      .inSingletonScope();
  });
}

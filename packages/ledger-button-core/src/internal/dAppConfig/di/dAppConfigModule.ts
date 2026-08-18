import { ContainerModule } from "inversify";

import { DAppConfigDataSource } from "../datasource/DAppConfigDataSource";
import { StubDAppConfigDataSource } from "../datasource/StubDAppConfigDataSource";
import { GetDAppConfigUseCase } from "../use-case/GetDAppConfigUseCase";
import { dAppConfigModuleTypes } from "./dAppConfigModuleTypes";

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

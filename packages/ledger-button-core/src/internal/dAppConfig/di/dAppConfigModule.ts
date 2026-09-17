import { ContainerModule } from "inversify";

import { DAppConfigDataSource } from "../datasource/DAppConfigDataSource";
import { DefaultDAppConfigDataSource } from "../datasource/DefaultDAppConfigDataSource";
import { StubDAppConfigDataSource } from "../datasource/StubDAppConfigDataSource";
import { GetDAppConfigUseCase } from "../use-case/GetDAppConfigUseCase";
import { dAppConfigModuleTypes } from "./dAppConfigModuleTypes";

type DAppConfigModuleOptions = {
  stub?: boolean;
};

export function dAppConfigModuleFactory({ stub }: DAppConfigModuleOptions = {}) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind<DAppConfigDataSource>(dAppConfigModuleTypes.DAppConfigDataSource)
      .to(DefaultDAppConfigDataSource)
      .inSingletonScope();

    bind<GetDAppConfigUseCase>(dAppConfigModuleTypes.GetDAppConfigUseCase)
      .to(GetDAppConfigUseCase)
      .inSingletonScope();

    if (stub) {
      rebindSync<DAppConfigDataSource>(
        dAppConfigModuleTypes.DAppConfigDataSource,
      )
        .to(StubDAppConfigDataSource)
        .inSingletonScope();
    }
  });
}

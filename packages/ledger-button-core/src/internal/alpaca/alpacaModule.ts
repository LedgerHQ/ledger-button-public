import { ContainerModule } from "inversify";

import { DefaultEvmDataSource } from "./datasource/DefaultEvmDataSource.js";
import { EvmDataSource } from "./datasource/EvmDataSource.js";
import { StubEvmDataSource } from "./datasource/StubEvmDataSource.js";
import { AlpacaService } from "./service/AlpacaService.js";
import { DefaultAlpacaService } from "./service/DefaultAlpacaService.js";
import { ContainerOptions } from "../diTypes.js";
import { alpacaModuleTypes } from "./alpacaModuleTypes.js";

type AlpacaModuleOptions = Pick<ContainerOptions, "stub">

export function alpacaModuleFactory({ stub }: AlpacaModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind<AlpacaService>(alpacaModuleTypes.AlpacaService)
      .to(DefaultAlpacaService)
      .inSingletonScope();

    bind<EvmDataSource>(alpacaModuleTypes.EvmDataSource)
      .to(DefaultEvmDataSource)
      .inSingletonScope();

    if (stub) {
      rebindSync<EvmDataSource>(alpacaModuleTypes.EvmDataSource)
        .to(StubEvmDataSource)
        .inSingletonScope();
    }
  });
}

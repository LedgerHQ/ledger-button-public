import { ContainerModule } from "inversify";

import { DefaultContextService } from "../service/DefaultContextService";
import { contextModuleTypes } from "./contextModuleTypes";

export function contextModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(contextModuleTypes.ContextService)
      .to(DefaultContextService)
      .inSingletonScope();
  });
}

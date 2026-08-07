import { ContainerModule } from "inversify";

import { DefaultContextService } from "../DefaultContextService.js";
import { contextModuleTypes } from "./contextModuleTypes.js";

export function contextModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(contextModuleTypes.ContextService)
      .to(DefaultContextService)
      .inSingletonScope();
  });
}

import { ContainerModule } from "inversify";

import { NavigationIntentService } from "./service/NavigationIntentService.js";
import { navigationModuleTypes } from "./navigationModuleTypes.js";

export function navigationModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<NavigationIntentService>(
      navigationModuleTypes.NavigationIntentService,
    )
      .to(NavigationIntentService)
      .inSingletonScope();
  });
}

import { ContainerModule } from "inversify";

import { NavigationIntentService } from "../service/NavigationIntentService";
import { navigationModuleTypes } from "./navigationModuleTypes";

export function navigationModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<NavigationIntentService>(
      navigationModuleTypes.NavigationIntentService,
    )
      .to(NavigationIntentService)
      .inSingletonScope();
  });
}

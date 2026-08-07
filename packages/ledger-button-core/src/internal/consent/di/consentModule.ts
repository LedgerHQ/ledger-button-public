import { ContainerModule } from "inversify";

import { ConsentService } from "../service/ConsentService.js";
import { DefaultConsentService } from "../service/DefaultConsentService.js";
import { consentModuleTypes } from "./consentModuleTypes.js";

export function consentModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<ConsentService>(consentModuleTypes.ConsentService)
      .to(DefaultConsentService)
      .inSingletonScope();
  });
}

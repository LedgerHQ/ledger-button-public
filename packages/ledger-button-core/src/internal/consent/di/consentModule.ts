import { ContainerModule } from "inversify";

import { ConsentService } from "../ConsentService.js";
import { DefaultConsentService } from "../DefaultConsentService.js";
import { consentModuleTypes } from "./consentModuleTypes.js";

export function consentModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<ConsentService>(consentModuleTypes.ConsentService)
      .to(DefaultConsentService)
      .inSingletonScope();
  });
}

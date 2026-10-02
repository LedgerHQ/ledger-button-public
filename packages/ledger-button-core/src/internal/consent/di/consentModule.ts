import { ContainerModule } from "inversify";

import { ConsentService } from "../service/ConsentService";
import { DefaultConsentService } from "../service/DefaultConsentService";
import { consentModuleTypes } from "./consentModuleTypes";

export function consentModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<ConsentService>(consentModuleTypes.ConsentService)
      .to(DefaultConsentService)
      .inSingletonScope();
  });
}

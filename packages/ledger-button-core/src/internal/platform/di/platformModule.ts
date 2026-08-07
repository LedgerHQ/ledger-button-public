import { ContainerModule } from "inversify";

import { IsLedgerLiveMobileUseCase } from "../use-case/IsLedgerLiveMobileUseCase.js";
import { IsMobileUseCase } from "../use-case/IsMobileUseCase.js";
import {
  IsSupportedPlatformUseCase,
} from "../use-case/IsSupportedPlatformUseCase.js";
import { platformModuleTypes } from "./platformModuleTypes.js";

export function platformModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(platformModuleTypes.IsMobileUseCase).to(IsMobileUseCase);
    bind(platformModuleTypes.IsLedgerLiveMobileUseCase).to(
      IsLedgerLiveMobileUseCase,
    );
    bind(platformModuleTypes.IsSupportedPlatformUseCase).to(
      IsSupportedPlatformUseCase,
    );
  });
}

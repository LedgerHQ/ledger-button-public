import { ContainerModule } from "inversify";

import { IsLedgerLiveMobileUseCase } from "../use-case/IsLedgerLiveMobileUseCase";
import { IsMobileUseCase } from "../use-case/IsMobileUseCase";
import {
  IsSupportedPlatformUseCase,
} from "../use-case/IsSupportedPlatformUseCase";
import { platformModuleTypes } from "./platformModuleTypes";

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

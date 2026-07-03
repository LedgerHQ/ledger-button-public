import { type ContainerModuleLoadOptions } from "inversify";

import { DAppConfigV2DataSource } from "../datasource/DAppConfigV2DataSource.js";
import { StubDAppConfigV2DataSource } from "../datasource/StubDAppConfigV2DataSource.js";
import { GetDAppConfigV2UseCase } from "../use-case/GetDAppConfigV2UseCase.js";
import { dAppConfigV2ModuleTypes } from "./dAppConfigV2ModuleTypes.js";

export function bindDAppConfigV2({ bind }: ContainerModuleLoadOptions): void {
  // Only a stub data source exists for now (hardcoded values).
  // When a real backend implementation lands, swap this to the default
  // implementation and re-bind to the stub from the parent module's stub branch.
  bind<DAppConfigV2DataSource>(
    dAppConfigV2ModuleTypes.DAppConfigV2DataSource,
  )
    .to(StubDAppConfigV2DataSource)
    .inSingletonScope();

  bind<GetDAppConfigV2UseCase>(dAppConfigV2ModuleTypes.GetDAppConfigV2UseCase)
    .to(GetDAppConfigV2UseCase)
    .inSingletonScope();
}

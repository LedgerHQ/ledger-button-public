import { type ContainerModuleLoadOptions } from "inversify";

import { DAppConfigService } from "../service/DAppConfigService.js";
import { DefaultDAppConfigService } from "../service/DefaultDAppConfigService.js";
import { stubDAppConfig } from "../service/StubDAppConfig.js";
import { dAppConfigV1ModuleTypes } from "./dAppConfigV1ModuleTypes.js";

export type DAppConfigV1BindOptions = {
  stub?: boolean;
};

export function bindDAppConfigV1(
  { bind, rebindSync }: ContainerModuleLoadOptions,
  { stub }: DAppConfigV1BindOptions,
): void {
  bind<DAppConfigService>(dAppConfigV1ModuleTypes.DAppConfigService).to(
    DefaultDAppConfigService,
  );

  if (stub) {
    rebindSync<DAppConfigService>(
      dAppConfigV1ModuleTypes.DAppConfigService,
    ).toConstantValue({
      getDAppConfig() {
        return Promise.resolve(stubDAppConfig);
      },
    });
  }
}

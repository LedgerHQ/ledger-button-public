import { ContainerModule } from "inversify";
import { EitherAsync, Right } from "purify-ts";

import { dAppConfigModuleTypes } from "./dAppConfigModuleTypes.js";
import { DAppConfigService } from "./DAppConfigService.js";
import { DefaultDAppConfigService } from "./DefaultDAppConfigService.js";
import { stubDAppConfig } from "./StubDAppConfig.js";
import { DAppConfig } from "./types.js";

type DAppConfigModuleOptions = {
  stub?: boolean;
};

export function dAppConfigModuleFactory({ stub }: DAppConfigModuleOptions) {
  return new ContainerModule(({ rebindSync, bind }) => {
    bind<DAppConfigService>(dAppConfigModuleTypes.DAppConfigService).to(
      DefaultDAppConfigService,
    );

    if (stub) {
      rebindSync<DAppConfigService>(
        dAppConfigModuleTypes.DAppConfigService,
      ).toConstantValue({
        get: <K extends keyof DAppConfig>(key: K) =>
          EitherAsync.liftEither(Right(stubDAppConfig[key])),
      });
    }
  });
}

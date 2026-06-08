import { ContainerModule } from "inversify";

import { bindDAppConfigV1 } from "../v1/di/bindDAppConfigV1.js";
import { bindDAppConfigV2 } from "../v2/di/bindDAppConfigV2.js";

type DAppConfigModuleOptions = {
  stub?: boolean;
};

export function dAppConfigModuleFactory({ stub }: DAppConfigModuleOptions) {
  return new ContainerModule((options) => {
    bindDAppConfigV1(options, { stub });
    bindDAppConfigV2(options);
  });
}

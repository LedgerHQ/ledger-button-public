import { ContainerModule } from "inversify";

import { bindDAppConfigV2 } from "../v2/di/bindDAppConfigV2.js";

export function dAppConfigModuleFactory() {
  return new ContainerModule((options) => {
    bindDAppConfigV2(options);
  });
}

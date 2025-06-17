import { ContainerModule } from "inversify";

import { ContainerOptions } from "../di.js";
import { DefaultNetworkService } from "./DefaultNetworkService.js";
import { networkModuleTypes } from "./networkModuleTypes.js";

type NetworkModuleOptions = Pick<ContainerOptions, "stub">;

export function networkModuleFactory({ stub }: NetworkModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(networkModuleTypes.NetworkService).to(DefaultNetworkService);

    if (stub) {
      rebindSync(networkModuleTypes.NetworkService).toConstantValue({
        // TODO: Implement stub
      });
    }
  });
}

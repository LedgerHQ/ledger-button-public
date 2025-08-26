import { ContainerModule } from "inversify";

import { backendModuleTypes } from "./backendModuleTypes.js";
import { DefaultBackendService } from "./service/DefaultBackendService.js";
import { StubBackendService } from "./service/StubBackendService.js";

type BackendModuleOptions = Pick;

export function backendModuleFactory({ stub }: BackendModuleOptions) {
  return new ContainerModule(({ bind, rebind }) => {
    bind(backendModuleTypes.BackendService).to(DefaultBackendService);

    if (stub) {
      rebind(backendModuleTypes.BackendService).to(StubBackendService);
    }
  });
}

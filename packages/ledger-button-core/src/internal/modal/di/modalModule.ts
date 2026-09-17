import { ContainerModule } from "inversify";

import { ModalService } from "../service/ModalService";
import { modalModuleTypes } from "./modalModuleTypes";

export function modalModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<ModalService>(modalModuleTypes.ModalService)
      .to(ModalService)
      .inSingletonScope();
  });
}

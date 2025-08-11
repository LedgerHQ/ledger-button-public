import { ContainerModule } from "inversify";

import { GenerateKeypairUseCase } from "./usecases/GenerateKeypairUseCase.js";
import { ContainerOptions } from "../diTypes.js";
import { cryptographicModuleTypes } from "./cryptographicModuleTypes.js";

type CryptographicModuleOptions = Pick<ContainerOptions, "stub">;

export function cryptographicModuleFactory({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stub,
}: CryptographicModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(cryptographicModuleTypes.GenerateKeypairUseCase).to(
      GenerateKeypairUseCase,
    );
  });
}

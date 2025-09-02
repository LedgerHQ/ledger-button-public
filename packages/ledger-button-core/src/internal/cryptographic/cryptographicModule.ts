import { ContainerModule } from "inversify";

import { GenerateKeypairUseCase } from "./usecases/GenerateKeypairUseCase.js";
import { cryptographicModuleTypes } from "./cryptographicModuleTypes.js";

type CryptographicModuleOptions = {
  stub?: boolean;
};

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

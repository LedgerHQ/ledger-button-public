import { ContainerModule } from "inversify";

import { DecryptKeyPairUseCase } from "./usecases/DecryptKeyPairUseCase.js";
import { EncryptKeyPairUseCase } from "./usecases/EncryptKeyPairUseCase.js";
import { GenerateKeyPairUseCase } from "./usecases/GenerateKeyPairUseCase.js";
import { GetEncryptionKeyUseCase } from "./usecases/GetEncryptionKey.js";
import { GetKeyPairUseCase } from "./usecases/GetKeyPairUseCase.js";
import { cryptographicModuleTypes } from "./cryptographicModuleTypes.js";

type CryptographicModuleOptions = {
  stub?: boolean;
};

export function cryptographicModuleFactory({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stub,
}: CryptographicModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(cryptographicModuleTypes.GenerateKeyPairUseCase).to(
      GenerateKeyPairUseCase,
    );
    bind(cryptographicModuleTypes.EncryptKeyPairUseCase).to(
      EncryptKeyPairUseCase,
    );
    bind(cryptographicModuleTypes.GetEncryptionKeyUseCase).to(
      GetEncryptionKeyUseCase,
    );
    bind(cryptographicModuleTypes.GetKeyPairUseCase).to(GetKeyPairUseCase);
    bind(cryptographicModuleTypes.DecryptKeyPairUseCase).to(
      DecryptKeyPairUseCase,
    );
  });
}

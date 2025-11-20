import { ContainerModule } from "inversify";

import { DecryptKeypairUseCase } from "./usecases/DecryptKeypairUseCase.js";
import { EncryptKeypairUseCase } from "./usecases/EncryptKeypairUseCase.js";
import { GenerateKeypairUseCase } from "./usecases/GenerateKeypairUseCase.js";
import { GetEncryptionKeyUseCase } from "./usecases/GetEncryptionKey.js";
import { GetOrCreateKeyPairUseCase } from "./usecases/GetOrCreateKeyPairUseCase.js";
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
    bind(cryptographicModuleTypes.EncryptKeypairUseCase).to(
      EncryptKeypairUseCase,
    );
    bind(cryptographicModuleTypes.GetEncryptionKeyUseCase).to(
      GetEncryptionKeyUseCase,
    );
    bind(cryptographicModuleTypes.GetOrCreateKeyPairUseCase).to(
      GetOrCreateKeyPairUseCase,
    );
    bind(cryptographicModuleTypes.DecryptKeypairUseCase).to(
      DecryptKeypairUseCase,
    );
  });
}

import { ContainerModule } from "inversify";

import { DecryptKeyPairUseCase } from "../use-case/DecryptKeyPairUseCase.js";
import { EncryptKeyPairUseCase } from "../use-case/EncryptKeyPairUseCase.js";
import { GenerateKeyPairUseCase } from "../use-case/GenerateKeyPairUseCase.js";
import { GetEncryptionKeyUseCase } from "../use-case/GetEncryptionKey.js";
import { GetOrCreateKeyPairUseCase } from "../use-case/GetOrCreateKeyPairUseCase.js";
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
    bind(cryptographicModuleTypes.GetOrCreateKeyPairUseCase).to(
      GetOrCreateKeyPairUseCase,
    );
    bind(cryptographicModuleTypes.DecryptKeyPairUseCase).to(
      DecryptKeyPairUseCase,
    );
  });
}

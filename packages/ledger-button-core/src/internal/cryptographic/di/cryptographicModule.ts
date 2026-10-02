import { ContainerModule } from "inversify";

import { DecryptKeyPairUseCase } from "../use-case/DecryptKeyPairUseCase";
import { EncryptKeyPairUseCase } from "../use-case/EncryptKeyPairUseCase";
import { GenerateKeyPairUseCase } from "../use-case/GenerateKeyPairUseCase";
import { GetEncryptionKeyUseCase } from "../use-case/GetEncryptionKey";
import { GetOrCreateKeyPairUseCase } from "../use-case/GetOrCreateKeyPairUseCase";
import { cryptographicModuleTypes } from "./cryptographicModuleTypes";

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

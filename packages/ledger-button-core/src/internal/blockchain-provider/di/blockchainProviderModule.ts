import { ContainerModule, type Factory } from "inversify";

import type { BlockchainProviderManager } from "../service/BlockchainProviderManager";
import type { CoreFacadeService } from "../service/CoreFacadeService";
import { DefaultBlockchainProviderManager } from "../service/DefaultBlockchainProviderManager";
import { DefaultCoreFacadeService } from "../service/DefaultCoreFacadeService";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes";

export function blockchainProviderModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<BlockchainProviderManager>(
      blockchainProviderModuleTypes.BlockchainProviderManager,
    )
      .to(DefaultBlockchainProviderManager)
      .inSingletonScope();

    bind<Factory<BlockchainProviderManager>>(
      blockchainProviderModuleTypes.BlockchainProviderManagerFactory,
    ).toFactory((context) => {
      return () =>
        context.get<BlockchainProviderManager>(
          blockchainProviderModuleTypes.BlockchainProviderManager,
        );
    });

    bind<CoreFacadeService>(blockchainProviderModuleTypes.CoreFacadeService)
      .to(DefaultCoreFacadeService)
      .inSingletonScope();
  });
}

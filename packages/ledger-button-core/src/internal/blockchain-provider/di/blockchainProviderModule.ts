import { ContainerModule, type Factory } from "inversify";

import type { BlockchainProviderManager } from "../service/BlockchainProviderManager.js";
import type { CoreFacadeService } from "../service/CoreFacadeService.js";
import { DefaultBlockchainProviderManager } from "../service/DefaultBlockchainProviderManager.js";
import { DefaultCoreFacadeService } from "../service/DefaultCoreFacadeService.js";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes.js";

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

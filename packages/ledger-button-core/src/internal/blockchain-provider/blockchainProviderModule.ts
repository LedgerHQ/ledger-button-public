import { ContainerModule } from "inversify";

import type { BlockchainProviderManager } from "./service/BlockchainProviderManager.js";
import type { CoreFacadeService } from "./service/CoreFacadeService.js";
import { DefaultBlockchainProviderManager } from "./service/DefaultBlockchainProviderManager.js";
import { DefaultCoreFacadeService } from "./service/DefaultCoreFacadeService.js";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes.js";

export function blockchainProviderModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<BlockchainProviderManager>(
      blockchainProviderModuleTypes.BlockchainProviderManager,
    )
      .to(DefaultBlockchainProviderManager)
      .inSingletonScope();

    bind<CoreFacadeService>(blockchainProviderModuleTypes.CoreFacadeService)
      .to(DefaultCoreFacadeService)
      .inSingletonScope();
  });
}

import { ContainerModule } from "inversify";

import { BlockchainProviderManager } from "../BlockchainProviderManager.js";
import { CoreFacadeService } from "../service/CoreFacadeService.js";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes.js";

export function blockchainProviderModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<BlockchainProviderManager>(
      blockchainProviderModuleTypes.BlockchainProviderManager,
    )
      .to(BlockchainProviderManager)
      .inSingletonScope();

    bind<CoreFacadeService>(blockchainProviderModuleTypes.CoreFacadeService)
      .to(CoreFacadeService)
      .inSingletonScope();
  });
}

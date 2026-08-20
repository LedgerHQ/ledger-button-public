import { ContainerModule } from "inversify";

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

    bind<CoreFacadeService>(blockchainProviderModuleTypes.CoreFacadeService)
      .to(DefaultCoreFacadeService)
      .inSingletonScope();
  });
}

import { ContainerModule } from "inversify";

import { BlockchainProviderManager } from "../BlockchainProviderManager.js";
import { WalletProviderHostService } from "../service/WalletProviderHostService.js";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes.js";

export function blockchainProviderModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<BlockchainProviderManager>(
      blockchainProviderModuleTypes.BlockchainProviderManager,
    )
      .to(BlockchainProviderManager)
      .inSingletonScope();

    bind<WalletProviderHostService>(
      blockchainProviderModuleTypes.WalletProviderHostService,
    )
      .to(WalletProviderHostService)
      .inSingletonScope();
  });
}

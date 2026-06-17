import { ContainerModule } from "inversify";

import { BlockchainProviderManager } from "../BlockchainProviderManager.js";
import { WalletProviderCoreService } from "../service/WalletProviderCoreService.js";
import { blockchainProviderModuleTypes } from "./blockchainProviderModuleTypes.js";

export function blockchainProviderModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<BlockchainProviderManager>(
      blockchainProviderModuleTypes.BlockchainProviderManager,
    )
      .to(BlockchainProviderManager)
      .inSingletonScope();

    bind<WalletProviderCoreService>(
      blockchainProviderModuleTypes.WalletProviderCoreService,
    )
      .to(WalletProviderCoreService)
      .inSingletonScope();
  });
}

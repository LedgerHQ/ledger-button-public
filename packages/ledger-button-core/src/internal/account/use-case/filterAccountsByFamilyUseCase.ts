import { inject, injectable } from "inversify";

import { type BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import { type BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";

@injectable()
export class FilterAccountsByFamilyUseCase {
  constructor(
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
  ) {}

  execute<T extends { currencyId: string }>(
    accounts: T[],
    family?: BlockchainFamily,
  ): T[] {
    if (!family) {
      return accounts;
    }

    return accounts.filter((account) =>
      this.belongsToFamily(account.currencyId, family),
    );
  }

  private belongsToFamily(
    currencyId: string,
    family: BlockchainFamily,
  ): boolean {
    return this.blockchainProviderManager
      .resolveBlockchainFamily(currencyId)
      .map((resolved) => resolved === family)
      .orDefault(false);
  }
}

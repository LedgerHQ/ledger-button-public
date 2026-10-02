import { inject, injectable } from "inversify";

import { type BlockchainFamily } from "@api/blockchain-provider/model/types";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import { type BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";

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
      .describeCurrency(currencyId)
      .map((currency) => currency.family === family)
      .orDefault(false);
  }
}

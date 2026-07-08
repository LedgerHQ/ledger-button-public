import { inject, injectable } from "inversify";
import { map, type Observable } from "rxjs";

import { type BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import { DEFAULT_BLOCKCHAIN_FAMILY } from "../../../api/model/ButtonCoreContext.js";
import { blockchainProviderModuleTypes } from "../../blockchain-provider/blockchainProviderModuleTypes.js";
import { type BlockchainProviderManager } from "../../blockchain-provider/service/BlockchainProviderManager.js";
import type { AccountWithFiat } from "../service/AccountService.js";

@injectable()
export class FilterAccountsByFamilyUseCase {
  constructor(
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
  ) {}

  execute(
    accounts$: Observable<AccountWithFiat[]>,
    family?: BlockchainFamily,
  ): Observable<AccountWithFiat[]> {
    if (!family) {
      return accounts$;
    }

    return accounts$.pipe(
      map((accounts) =>
        accounts.filter(
          (account) =>
            this.resolveBlockchainFamily(account.currencyId) === family,
        ),
      ),
    );
  }

  private resolveBlockchainFamily(currencyId: string): BlockchainFamily {
    return this.blockchainProviderManager
      .resolveBlockchainFamily(currencyId)
      .orDefault(DEFAULT_BLOCKCHAIN_FAMILY);
  }
}

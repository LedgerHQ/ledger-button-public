import { inject, injectable } from "inversify";

import type { AccountWithFiat, Network } from "@api/model/Account.js";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import type { CurrencyInformation } from "@internal/balance/datasource/cal/calTypes.js";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes.js";

/**
 * Builds the network breakdown of a single address: one entry per account
 * sharing that address, enriched with CAL metadata and sorted by fiat value.
 * Callers are expected to pass accounts whose fiat is already hydrated.
 */
@injectable()
export class BuildNetworksUseCase {
  private readonly currencyInformationCache = new Map<
    string,
    CurrencyInformation | undefined
  >();

  constructor(
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
  ) {}

  async execute(accounts: AccountWithFiat[]): Promise<Network[]> {
    const networks = await Promise.all(
      accounts.map((account) => this.toNetwork(account)),
    );

    return this.sortByFiatValue(networks);
  }

  private async toNetwork(account: AccountWithFiat): Promise<Network> {
    const info = await this.getCurrencyInformation(account.currencyId);

    return {
      id: account.currencyId,
      name: info?.name ?? account.currencyId,
      ticker: info?.ticker ?? account.ticker,
      balance: account.balance,
      fiatBalance: account.fiatBalance,
    };
  }

  private async getCurrencyInformation(
    currencyId: string,
  ): Promise<CurrencyInformation | undefined> {
    if (this.currencyInformationCache.has(currencyId)) {
      return this.currencyInformationCache.get(currencyId);
    }

    const result = await this.calDataSource.getCurrencyInformation(currencyId);
    const info = result.isRight() ? result.extract() : undefined;
    this.currencyInformationCache.set(currencyId, info);

    return info;
  }

  private sortByFiatValue(networks: Network[]): Network[] {
    return [...networks].sort((a, b) => {
      const aFiat = parseFloat(a.fiatBalance?.value ?? "0");
      const bFiat = parseFloat(b.fiatBalance?.value ?? "0");
      return bFiat - aFiat;
    });
  }
}

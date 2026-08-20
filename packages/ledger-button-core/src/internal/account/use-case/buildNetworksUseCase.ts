import { inject, injectable } from "inversify";

import type { AccountWithFiat, FiatBalance, Network } from "@api/model/Account";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource";
import type { CurrencyInformation } from "@internal/balance/datasource/cal/calTypes";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes";


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

    return this.sortByTotalFiatValue(networks);
  }

  private async toNetwork(account: AccountWithFiat): Promise<Network> {
    const info = await this.getCurrencyInformation(account.currencyId);

    return {
      id: account.currencyId,
      name: info?.name ?? account.currencyId,
      ticker: info?.ticker ?? account.ticker,
      balance: account.balance,
      fiatBalance: account.fiatBalance,
      totalFiatBalance: this.computeTotalFiatBalance(account),
    };
  }

  private toFiniteFloat(value: string): number {
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : 0;
  }

  private computeTotalFiatBalance(
    account: AccountWithFiat,
  ): FiatBalance | undefined {
    if (!account.fiatBalance) return undefined;

    const nativeFiat = this.toFiniteFloat(account.fiatBalance.value);
    const tokensFiat = account.tokens.reduce((sum, token) => {
      if (!token.fiatBalance?.value) return sum;
      return sum + this.toFiniteFloat(token.fiatBalance.value);
    }, 0);

    return {
      value: (nativeFiat + tokensFiat).toFixed(2),
      currency: account.fiatBalance.currency,
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

  private sortByTotalFiatValue(networks: Network[]): Network[] {
    return [...networks].sort((a, b) => {
      const aFiat = a.totalFiatBalance?.value
        ? this.toFiniteFloat(a.totalFiatBalance.value)
        : 0;
      const bFiat = b.totalFiatBalance?.value
        ? this.toFiniteFloat(b.totalFiatBalance.value)
        : 0;
      return bFiat - aFiat;
    });
  }
}

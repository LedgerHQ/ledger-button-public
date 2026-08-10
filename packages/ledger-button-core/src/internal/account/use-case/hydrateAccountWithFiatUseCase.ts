import { type Factory, inject, injectable } from "inversify";
import { type Either } from "purify-ts";

import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import type { CounterValueResult } from "../../balance/datasource/countervalue/counterValueTypes.js";
import { balanceModuleTypes } from "../../balance/di/balanceModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { contextModuleTypes } from "../../context/di/contextModuleTypes.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { enrichWithLoadingStates } from "../accountFiatUtils.js";
import type {
  Account,
  AccountWithFiat,
  FiatBalance,
  Token,
} from "../service/AccountService.js";

@injectable()
export class HydrateAccountWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.CounterValueDataSource)
    private readonly counterValueDataSource: CounterValueDataSource,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("HydrateAccountWithFiatUseCase");
  }

  async execute(account: Account): Promise<AccountWithFiat> {
    const currency = this.contextService.getContext().preferredFiatCurrency;
    this.logHydrationStart(account);

    const balance = account.balance ?? "0";
    const balanceNum = this.parseBalance(balance);
    const hasNoNativeBalance = Number.isNaN(balanceNum) || balanceNum === 0;

    if (hasNoNativeBalance && account.tokens.length === 0) {
      return enrichWithLoadingStates({
        ...account,
        fiatBalance: { value: "0.00", currency },
        fiatError: false,
      });
    }

    const counterValuesResult = await this.fetchCounterValues(
      account,
      currency,
    );

    return counterValuesResult.caseOf<AccountWithFiat>({
      Left: (error) => {
        this.logger.warn("Failed to fetch counter values", { error });
        return enrichWithLoadingStates({
          ...account,
          fiatBalance: undefined,
          fiatError: true,
        });
      },
      Right: (counterValues) => {
        const accountFiatBalance = this.calculateAccountFiat(
          balance,
          counterValues[0]?.rate,
          currency,
        );

        const tokensWithFiat = this.hydrateTokensWithFiat(
          account.tokens,
          counterValues.slice(1),
          currency,
        );

        this.logHydrationSuccess(accountFiatBalance, tokensWithFiat, currency);

        return enrichWithLoadingStates({
          ...account,
          fiatBalance: accountFiatBalance,
          fiatError: false,
          tokens: tokensWithFiat,
        });
      },
    });
  }

  private logHydrationStart(account: Account): void {
    this.logger.debug("Hydrating account with fiat balance", {
      address: account.freshAddress,
      currencyId: account.currencyId,
      tokenCount: account.tokens.length,
    });
  }

  private async fetchCounterValues(
    account: Account,
    targetCurrency: string,
  ): Promise<Either<Error, CounterValueResult[]>> {
    const ledgerIds = this.buildLedgerIds(account);
    this.logger.debug("Fetching counter values", { ledgerIds, targetCurrency });
    return this.counterValueDataSource.getCounterValues(
      ledgerIds,
      targetCurrency,
    );
  }

  private buildLedgerIds(account: Account): string[] {
    return [
      account.currencyId,
      ...account.tokens.map((token) => token.ledgerId),
    ];
  }

  private logHydrationSuccess(
    accountFiat: FiatBalance | undefined,
    tokens: Token[],
    currency: string,
  ): void {
    this.logger.debug("Successfully calculated fiat balances", {
      accountFiat: accountFiat?.value,
      tokensWithFiat: tokens.filter((t) => t.fiatBalance).length,
      currency,
    });
  }

  private calculateAccountFiat(
    balance: string,
    rate: number | undefined,
    currency: string,
  ): FiatBalance | undefined {
    const balanceNum = this.parseBalance(balance);
    if (Number.isNaN(balanceNum)) {
      return undefined;
    }
    if (balanceNum === 0) {
      return { value: "0.00", currency };
    }
    if (rate === undefined) {
      return undefined;
    }
    const fiatValue = balanceNum * rate;
    return {
      value: fiatValue.toFixed(2),
      currency,
    };
  }

  private hydrateTokensWithFiat(
    tokens: Token[],
    counterValues: CounterValueResult[],
    currency: string,
  ): Token[] {
    return tokens.map((token, index) => {
      const rate = counterValues[index]?.rate;
      const balanceNum = this.parseBalance(token.balance);

      if (Number.isNaN(balanceNum) || rate === undefined || rate === 0) {
        return token;
      }

      const fiatValue = balanceNum * rate;
      return {
        ...token,
        fiatBalance: {
          value: fiatValue.toFixed(2),
          currency,
        },
      };
    });
  }

  private parseBalance(balance: string): number {
    return parseFloat(balance.replace(/,/g, ""));
  }
}

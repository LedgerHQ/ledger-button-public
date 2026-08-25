import { type Factory, inject, injectable } from "inversify";

import type { Account, Token } from "@api/model/Account";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes";
import {
  type AccountBalance,
  type TokenBalance,
} from "@internal/balance/model/types";
import type { BalanceService } from "@internal/balance/service/BalanceService";
import {
  formatBalance,
  UNRESOLVED_DECIMALS,
} from "@internal/currency/currencyUtils";
import { currencyModuleTypes } from "@internal/currency/di/currencyModuleTypes";
import type { ResolveCurrencyDecimalsUseCase } from "@internal/currency/use-case/ResolveCurrencyDecimalsUseCase";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

@injectable()
export class HydrateAccountWithBalanceUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.BalanceService)
    private readonly balanceService: BalanceService,
    @inject(currencyModuleTypes.ResolveCurrencyDecimalsUseCase)
    private readonly resolveCurrencyDecimals: ResolveCurrencyDecimalsUseCase,
  ) {
    this.logger = loggerFactory("HydrateAccountWithBalanceUseCase");
  }

  async execute(account: Account, withTokens = true): Promise<Account> {
    this.logger.debug("Hydrating account with balance and tokens", {
      address: account.freshAddress,
      currencyId: account.currencyId,
    });

    const balanceResult = await this.balanceService.getBalanceForAccount(
      account,
      withTokens,
    );

    if (balanceResult.isRight()) {
      return this.formatSuccessfulBalanceResult(
        account,
        balanceResult.extract() as AccountBalance,
      );
    }

    return this.handleBalanceServiceFailure(
      account,
      balanceResult.extract() as Error,
    );
  }

  private async formatSuccessfulBalanceResult(
    account: Account,
    balanceData: AccountBalance,
  ): Promise<Account> {
    const decimals = await this.resolveDecimals(account.currencyId);
    const balance = formatBalance(
      balanceData.nativeBalance.balance,
      decimals,
      account.ticker,
    );
    const tokens = this.mapTokenBalances(balanceData.tokenBalances);

    this.logger.debug("Successfully hydrated account with balance and tokens", {
      address: account.freshAddress,
      balance,
      tokenCount: tokens.length,
    });

    return { ...account, balance, tokens, balanceUnavailable: false };
  }

  private handleBalanceServiceFailure(
    account: Account,
    error: Error,
  ): Account {
    this.logger.warn(
      "Failed to fetch balance from balance service (CoinService)",
      {
        error,
        address: account.freshAddress,
      },
    );

    return {
      ...account,
      balance: undefined,
      tokens: [],
      balanceUnavailable: true,
    };
  }

  private async resolveDecimals(currencyId: string): Promise<number> {
    const decimals = await this.resolveCurrencyDecimals.execute(currencyId);

    return decimals.orDefaultLazy(() => {
      this.logger.warn("Unresolved decimals, formatting raw balance", {
        currencyId,
      });
      return UNRESOLVED_DECIMALS;
    });
  }

  private mapTokenBalances(tokenBalances: TokenBalance[]): Token[] {
    return tokenBalances.map((tokenBalance) => ({
      ledgerId: tokenBalance.ledgerId,
      ticker: tokenBalance.ticker,
      name: tokenBalance.name,
      balance: tokenBalance.balanceFormatted,
      fiatBalance: undefined,
    }));
  }
}

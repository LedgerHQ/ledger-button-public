import { type Factory, inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { Account } from "../../../internal/account/service/AccountService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { balanceModuleTypes } from "../balanceModuleTypes.js";
import type { AlpacaDataSource } from "../datasource/alpaca/AlpacaDataSource.js";
import { AlpacaBalance } from "../datasource/alpaca/alpacaTypes.js";
import type { CalDataSource } from "../datasource/cal/CalDataSource.js";
import {
  type AccountBalance,
  type NativeBalance,
  TokenBalance,
} from "../model/types.js";
import { type BalanceService } from "./BalanceService.js";

@injectable()
export class DefaultBalanceService implements BalanceService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.AlpacaDataSource)
    private readonly alpacaDataSource: AlpacaDataSource,
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
  ) {
    this.logger = this.loggerFactory("[Alpaca Service]");
  }

  async getBalanceForAccount(
    account: Account,
  ): Promise<Either<Error, AccountBalance>> {
    this.logger.debug("Getting balance for address", {
      address: account.freshAddress,
      currencyId: account.currencyId,
    });

    const balanceResult =
      await this.alpacaDataSource.getBalanceForAddressAndCurrencyId(
        account.freshAddress,
        account.currencyId,
      );
    if (balanceResult.isRight()) {
      const alpacaBalances: AlpacaBalance[] = balanceResult.extract();
      const alpacaNativeBalance = alpacaBalances.find(
        (balance) => balance.type === "native",
      );
      const tokenBalances: TokenBalance[] = await Promise.all(
        alpacaBalances
          .filter((balance) => balance.type !== "native")
          .map(async (balance) => {
            if (!balance.reference) {
              return undefined as TokenBalance | undefined;
            }
            const tokenInformationResult =
              await this.calDataSource.getTokenInformation(
                balance.reference,
                account.currencyId,
              );

            if (tokenInformationResult.isRight()) {
              return new TokenBalance(
                tokenInformationResult.extract().decimals,
                BigInt(balance.value),
                tokenInformationResult.extract().name,
                tokenInformationResult.extract().ticker,
              );
            } else {
              return undefined as TokenBalance | undefined;
            }
          }) as unknown as TokenBalance[],
      );

      if (!alpacaNativeBalance) {
        return Left(new Error("No native balance found"));
      }

      return Right({
        nativeBalance: {
          balance: BigInt(alpacaNativeBalance.value),
        } as NativeBalance,
        tokenBalances: tokenBalances.filter((t) => t !== undefined),
      });
    } else {
      return Left(new Error("Failed to fetch balance from Alpaca"));
    }
  }
}

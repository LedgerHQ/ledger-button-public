import { type Factory, inject, injectable } from "inversify";
import { type Maybe } from "purify-ts";

import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes.js";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

/**
 * Single owner of the decimals fallback chain: CAL metadata first, then the
 * blockchain provider that claims the currency. Returns `Nothing` when neither
 * knows the currency, leaving the display decision to the caller.
 */
@injectable()
export class ResolveCurrencyDecimalsUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("ResolveCurrencyDecimalsUseCase");
  }

  async execute(currencyId: string): Promise<Maybe<number>> {
    const fromCal = await this.decimalsFromCal(currencyId);

    return fromCal.altLazy(() => this.nativeDecimalsFromProvider(currencyId));
  }

  private async decimalsFromCal(currencyId: string): Promise<Maybe<number>> {
    const currencyInformation =
      await this.calDataSource.getCurrencyInformation(currencyId);

    currencyInformation.ifLeft((error) =>
      this.logger.warn("Failed to resolve decimals from CAL", {
        currencyId,
        error,
      }),
    );

    return currencyInformation.toMaybe().map((info) => info.decimals);
  }

  private nativeDecimalsFromProvider(currencyId: string): Maybe<number> {
    const nativeDecimals = this.blockchainProviderManager
      .describeCurrency(currencyId)
      .map((currency) => currency.nativeDecimals);

    if (nativeDecimals.isNothing()) {
      this.logger.warn("No registered provider claims currency", {
        currencyId,
      });
    }

    return nativeDecimals;
  }
}

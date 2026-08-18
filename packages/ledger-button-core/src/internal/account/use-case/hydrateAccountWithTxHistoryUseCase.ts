import type { Factory } from "inversify";
import { inject, injectable } from "inversify";

import type { Account } from "@api/model/Account";
import type { TransactionHistoryItem } from "@api/model/TransactionHistory";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { transactionHistoryModuleTypes } from "@internal/transaction-history/di/transactionHistoryModuleTypes";
import type { FetchTransactionHistoryUseCase } from "@internal/transaction-history/use-case/FetchTransactionHistoryUseCase";
import type { HydrateTransactionsWithFiatUseCase } from "@internal/transaction-history/use-case/HydrateTransactionsWithFiatUseCase";

export type AccountWithTransactionHistory = Account & {
  transactionHistory: TransactionHistoryItem[] | undefined;
  transactionExplorerUrlTemplate?: string;
};

@injectable()
export class HydrateAccountWithTxHistoryUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(transactionHistoryModuleTypes.FetchTransactionHistoryUseCase)
    private readonly fetchTransactionHistoryUseCase: FetchTransactionHistoryUseCase,
    @inject(transactionHistoryModuleTypes.HydrateTransactionsWithFiatUseCase)
    private readonly hydrateTransactionsWithFiatUseCase: HydrateTransactionsWithFiatUseCase,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("HydrateAccountWithTxHistoryUseCase");
  }

  async execute(account: Account): Promise<AccountWithTransactionHistory> {
    this.logger.debug("Fetching transaction history for account", {
      address: account.freshAddress,
      currencyId: account.currencyId,
    });

    const result = await this.fetchTransactionHistoryUseCase.execute(
      account.freshAddress,
      account.currencyId,
    );

    return await result.caseOf<Promise<AccountWithTransactionHistory>>({
      Left: (error) => {
        this.logger.warn("Failed to fetch transaction history", {
          error: error.message,
          currencyId: account.currencyId,
          address: account.freshAddress,
        });
        return Promise.resolve({
          ...account,
          transactionHistory: undefined,
        });
      },
      Right: async (historyResult) => {
        this.logger.debug("Transaction history fetched successfully", {
          currencyId: account.currencyId,
          transactionCount: historyResult.transactions.length,
        });
        const hydratedTransactions =
          await this.hydrateTransactionsWithFiatUseCase.execute(
            historyResult.transactions,
            this.contextService.getContext().preferredFiatCurrency,
          );
        return {
          ...account,
          transactionHistory: hydratedTransactions,
          transactionExplorerUrlTemplate:
            historyResult.transactionExplorerUrlTemplate,
        };
      },
    });
  }
}

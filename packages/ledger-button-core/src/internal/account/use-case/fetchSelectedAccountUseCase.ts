import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";
import { lastValueFrom } from "rxjs";

import {
  AccountNotFoundError,
  NoSelectedAccountError,
} from "../../../api/errors/LedgerSyncErrors.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { ledgerSyncModuleTypes } from "../../ledgersync/ledgerSyncModuleTypes.js";
import type { LedgerSyncService } from "../../ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { calculateTotalFiatValue } from "../accountFiatUtils.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type {
  Account,
  AccountWithFiat,
  DetailedAccount,
  Network,
} from "../service/AccountService.js";
import type { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import type { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";
import type { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase.js";
import type {
  AccountWithTransactionHistory,
  HydrateAccountWithTxHistoryUseCase,
} from "./hydrateAccountWithTxHistoryUseCase.js";

export type AccountError = NoSelectedAccountError | AccountNotFoundError;

@injectable()
export class FetchSelectedAccountUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(ledgerSyncModuleTypes.LedgerSyncService)
    private readonly ledgerSyncService: LedgerSyncService,
    @inject(accountModuleTypes.FetchAccountsUseCase)
    private readonly fetchAccountsUseCase: FetchAccountsUseCase,
    @inject(accountModuleTypes.HydrateAccountWithBalanceUseCase)
    private readonly hydrateWithBalanceUseCase: HydrateAccountWithBalanceUseCase,
    @inject(accountModuleTypes.HydrateAccountWithFiatUseCase)
    private readonly hydrateWithFiatUseCase: HydrateAccountWithFiatUseCase,
    @inject(accountModuleTypes.HydrateAccountWithTxHistoryUseCase)
    private readonly hydrateWithTxHistoryUseCase: HydrateAccountWithTxHistoryUseCase,
  ) {
    this.logger = loggerFactory("FetchSelectedAccountUseCase");
  }

  async execute(): Promise<Either<AccountError, DetailedAccount>> {
    const result = await this.getSelectedAccountFromContext();

    if (result.isLeft()) {
      return result;
    }

    const { selected, allAccounts } = result.unsafeCoerce();
    const detailedAccount = await this.hydrateDetailedAccount(
      selected,
      allAccounts,
    );

    this.emitAccountChangedEvent(detailedAccount);

    this.logger.info("Selected account fetched with details", {
      address: detailedAccount.freshAddress,
      hasBalance: !!detailedAccount.balance,
      hasFiat: !!detailedAccount.fiatBalance,
      txCount: detailedAccount.transactionHistory?.length ?? 0,
    });

    return Right(detailedAccount);
  }

  private async getSelectedAccountFromContext(): Promise<
    Either<AccountError, { selected: Account; allAccounts: Account[] }>
  > {
    const context = this.contextService.getContext();

    if (!context.selectedAccount) {
      return Left(new NoSelectedAccountError());
    }

    await lastValueFrom(this.ledgerSyncService.authenticate());

    const accounts = await this.fetchAccountsUseCase.execute();
    const account = accounts.find(
      (a) =>
        a.freshAddress === context.selectedAccount?.freshAddress &&
        a.currencyId === context.selectedAccount?.currencyId,
    );

    if (!account) {
      this.logger.error("Selected account not found in Ledger Sync accounts", {
        address: context.selectedAccount?.freshAddress,
      });

      return Left(
        new AccountNotFoundError(
          "Selected account not found in Ledger Sync accounts",
          { address: context.selectedAccount.freshAddress },
        ),
      );
    }

    return Right({ selected: account, allAccounts: accounts });
  }

  private async hydrateDetailedAccount(
    account: Account,
    allAccounts: Account[],
  ): Promise<DetailedAccount> {
    const withBalance = await this.hydrateWithBalanceUseCase.execute(account);

    const [withFiat, withTxHistory] = await Promise.all([
      this.hydrateWithFiatUseCase.execute(withBalance),
      this.hydrateWithTxHistoryUseCase.execute(withBalance),
    ]);

    const networks = this.computeNetworksFromAllAccounts(
      account,
      allAccounts,
    );
    return this.mergeHydrations(withBalance, withFiat, withTxHistory, networks);
  }

  private computeNetworksFromAllAccounts(
    selectedAccount: Account,
    allAccounts: Account[],
  ): Network[] {
    return allAccounts
      .filter((a) => a.freshAddress === selectedAccount.freshAddress)
      .map((a) => ({ id: a.currencyId, name: a.currencyId }));
  }

  private mergeHydrations(
    withBalance: Account,
    withFiat: AccountWithFiat,
    withTxHistory: AccountWithTransactionHistory,
    networks: Network[],
  ): DetailedAccount {
    const totalFiatValue = calculateTotalFiatValue(withFiat);
    return {
      ...withBalance,
      fiatBalance: withFiat.fiatBalance,
      tokens: withFiat.tokens,
      transactionHistory: withTxHistory.transactionHistory,
      totalFiatValue,
      networks,
    };
  }

  private emitAccountChangedEvent(account: DetailedAccount): void {
    this.contextService.onEvent({
      type: "account_changed",
      account,
    });
  }
}

import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";
import { lastValueFrom } from "rxjs";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import {
  AccountNotFoundError,
  NoSelectedAccountError,
} from "@api/errors/LedgerSyncErrors.js";
import type {
  Account,
  AccountWithFiat,
  DetailedAccount,
  Network,
} from "@api/model/Account.js";
import {
  DEFAULT_BLOCKCHAIN_FAMILY,
  getSelectedAccount,
} from "@api/model/ButtonCoreContext.js";
import type { ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";
import { ledgerSyncModuleTypes } from "@internal/ledgersync/di/ledgerSyncModuleTypes.js";
import type { LedgerSyncService } from "@internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

import { calculateTotalFiatValue } from "../accountFiatUtils.js";
import { accountModuleTypes } from "../di/accountModuleTypes.js";
import type { BuildNetworksUseCase } from "./buildNetworksUseCase.js";
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
    @inject(accountModuleTypes.BuildNetworksUseCase)
    private readonly buildNetworksUseCase: BuildNetworksUseCase,
  ) {
    this.logger = loggerFactory("FetchSelectedAccountUseCase");
  }

  async execute(
    family: BlockchainFamily = DEFAULT_BLOCKCHAIN_FAMILY,
  ): Promise<Either<AccountError, DetailedAccount>> {
    const result = await this.getSelectedAccountFromContext(family);

    if (result.isLeft()) {
      return result;
    }

    const { selected, allAccounts } = result.unsafeCoerce();
    const detailedAccount = await this.hydrateDetailedAccount(
      selected,
      allAccounts,
    );

    this.contextService.onEvent({
      type: "hydrated_account",
      account: detailedAccount,
    });

    this.logger.info("Selected account fetched with details", {
      address: detailedAccount.freshAddress,
      hasBalance: !!detailedAccount.balance,
      hasFiat: !!detailedAccount.fiatBalance,
      txCount: detailedAccount.transactionHistory?.length ?? 0,
    });

    return Right(detailedAccount);
  }

  private async getSelectedAccountFromContext(
    family: BlockchainFamily,
  ): Promise<
    Either<AccountError, { selected: Account; allAccounts: Account[] }>
  > {
    const context = this.contextService.getContext();
    const selectedAccount = getSelectedAccount(context, family);

    if (!selectedAccount) {
      return Left(new NoSelectedAccountError());
    }

    await lastValueFrom(this.ledgerSyncService.authenticate());

    const accounts = await this.fetchAccountsUseCase.execute();
    const account = accounts.find(
      (a) =>
        a.freshAddress === selectedAccount.freshAddress &&
        a.currencyId === selectedAccount.currencyId,
    );

    if (!account) {
      this.logger.error("Selected account not found in Ledger Sync accounts", {
        address: selectedAccount.freshAddress,
      });

      return Left(
        new AccountNotFoundError(
          "Selected account not found in Ledger Sync accounts",
          { address: selectedAccount.freshAddress },
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

    const [withFiat, withTxHistory, networks] = await Promise.all([
      this.hydrateWithFiatUseCase.execute(withBalance),
      this.hydrateWithTxHistoryUseCase.execute(withBalance),
      this.computeNetworksFromAllAccounts(account, allAccounts),
    ]);

    return this.mergeHydrations(withBalance, withFiat, withTxHistory, networks);
  }

  private async computeNetworksFromAllAccounts(
    selectedAccount: Account,
    allAccounts: Account[],
  ): Promise<Network[]> {
    const matching = allAccounts.filter(
      (a) => a.freshAddress === selectedAccount.freshAddress,
    );

    const withFiat = await Promise.all(
      matching.map((a) => this.hydrateWithFiatUseCase.execute(a)),
    );

    return this.buildNetworksUseCase.execute(withFiat);
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
      transactionExplorerUrlTemplate:
        withTxHistory.transactionExplorerUrlTemplate,
      totalFiatValue,
      networks,
    };
  }
}

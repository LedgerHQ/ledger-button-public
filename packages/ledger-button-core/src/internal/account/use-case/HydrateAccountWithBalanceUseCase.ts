import { type Factory, inject, injectable } from "inversify";

import type { Account, Token } from "@api/model/Account.js";
import { DEFAULT_BLOCKCHAIN_FAMILY } from "@api/model/ButtonCoreContext.js";
import type { BackendService } from "@internal/backend/BackendService.js";
import { backendModuleTypes } from "@internal/backend/di/backendModuleTypes.js";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes.js";
import {
  type AccountBalance,
  type TokenBalance,
} from "@internal/balance/model/types.js";
import type { BalanceService } from "@internal/balance/service/BalanceService.js";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import {
  formatBalance,
  UNRESOLVED_DECIMALS,
} from "@internal/currency/currencyUtils.js";
import { currencyModuleTypes } from "@internal/currency/di/currencyModuleTypes.js";
import type { ResolveCurrencyDecimalsUseCase } from "@internal/currency/use-case/ResolveCurrencyDecimalsUseCase.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

@injectable()
export class HydrateAccountWithBalanceUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.BalanceService)
    private readonly balanceService: BalanceService,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(currencyModuleTypes.ResolveCurrencyDecimalsUseCase)
    private readonly resolveCurrencyDecimals: ResolveCurrencyDecimalsUseCase,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
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

    return { ...account, balance, tokens };
  }

  private async handleBalanceServiceFailure(
    account: Account,
    error: Error,
  ): Promise<Account> {
    this.logger.warn(
      "Failed to fetch balance from balance service (CoinService), falling back to RPC node",
      {
        error,
        address: account.freshAddress,
      },
    );

    const balance = await this.fetchBalanceFromRpc(account);

    return { ...account, balance, tokens: [] };
  }

  private async fetchBalanceFromRpc(account: Account): Promise<string> {
    const decimals = await this.resolveDecimals(account.currencyId);
    const currency = this.blockchainProviderManager.describeCurrency(
      account.currencyId,
    );
    const chainId = currency.map(({ networkId }) => networkId).orDefault("1");
    const blockchainName = currency
      .map(({ family }) => family)
      .orDefault(DEFAULT_BLOCKCHAIN_FAMILY);
    const balanceRpcResult = await this.backendService.broadcast({
      blockchain: { name: blockchainName, chainId },
      rpc: {
        method: "eth_getBalance",
        params: [account.freshAddress, "latest"],
        id: 1,
        jsonrpc: "2.0",
      },
    });

    if (balanceRpcResult.isRight()) {
      const extract = balanceRpcResult.extract();
      if ("result" in extract) {
        const balanceHex = extract.result as string;
        return formatBalance(balanceHex, decimals, account.ticker);
      }
    }

    return formatBalance(BigInt(0), decimals, account.ticker);
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

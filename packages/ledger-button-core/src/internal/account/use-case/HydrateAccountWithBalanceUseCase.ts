import { type Factory, inject, injectable } from "inversify";

import type { Account, Token } from "@api/model/Account.js";
import type { BackendService } from "@internal/backend/BackendService.js";
import { backendModuleTypes } from "@internal/backend/di/backendModuleTypes.js";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes.js";
import {
  type AccountBalance,
  type TokenBalance,
} from "@internal/balance/model/types.js";
import type { BalanceService } from "@internal/balance/service/BalanceService.js";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import { formatBalance } from "@internal/currency/currencyUtils.js";
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
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
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
    const decimals = await this.resolveNativeDecimals(account);
    const balance = formatBalance(
      balanceData.nativeBalance.balance,
      decimals,
      account.ticker,
      account.currencyId,
      {},
      this.nativeDecimalsResolver,
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
    const decimals = await this.resolveNativeDecimals(account);
    const network = this.blockchainProviderManager.resolveNetwork(
      account.currencyId,
    );
    const chainId = network.map((ref) => ref.networkId).orDefault("1");
    const blockchainName = network
      .map((ref) => ref.blockchainName)
      .orDefault("ethereum");
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
        return formatBalance(
          balanceHex,
          decimals,
          account.ticker,
          account.currencyId,
          {},
          this.nativeDecimalsResolver,
        );
      }
    }

    return formatBalance(
      BigInt(0),
      decimals,
      account.ticker,
      account.currencyId,
      {},
      this.nativeDecimalsResolver,
    );
  }

  private async resolveNativeDecimals(
    account: Account,
  ): Promise<number | undefined> {
    const currencyInformationResult =
      await this.calDataSource.getCurrencyInformation(account.currencyId);

    if (currencyInformationResult.isRight()) {
      return currencyInformationResult.extract().decimals;
    }

    this.logger.warn(
      "Failed to resolve native decimals from CAL, falling back per-chain",
      {
        currencyId: account.currencyId,
        error: currencyInformationResult.extract(),
      },
    );

    return this.blockchainProviderManager
      .getNativeDecimals(account.currencyId)
      .mapOrDefault((decimals) => decimals, undefined);
  }

  private readonly nativeDecimalsResolver = (
    currencyId: string,
  ): number | undefined =>
    this.blockchainProviderManager
      .getNativeDecimals(currencyId)
      .mapOrDefault((decimals) => decimals, undefined);

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

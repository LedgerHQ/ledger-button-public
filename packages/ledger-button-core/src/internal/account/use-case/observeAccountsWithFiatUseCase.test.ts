import { type Factory } from "inversify";
import { type Observable, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { AccountWithFiat } from "../service/AccountService.js";
import type { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase.js";
import type { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase.js";
import type { FilterAccountsByFamilyUseCase } from "./filterAccountsByFamilyUseCase.js";
import { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase.js";
import type { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase.js";

const base: AccountWithFiat = {
  id: "a",
  currencyId: "ethereum",
  freshAddress: "0x00",
  seedIdentifier: "seed",
  derivationMode: "default",
  index: 0,
  name: "Account",
  ticker: "ETH",
  balance: "1.0",
  tokens: [],
  fiatBalance: undefined,
  fiatError: false,
  balanceLoadingState: "loaded",
  fiatLoadingState: "loaded",
};

type Mocks = {
  useCase: ObserveAccountsWithFiatUseCase;
  fetchAccountsWithBalanceUseCase: { execute: ReturnType<typeof vi.fn> };
  fetchAccountsWithFiatUseCase: { execute: ReturnType<typeof vi.fn> };
  sortAccountsByFiatUseCase: { execute: ReturnType<typeof vi.fn> };
  filterAccountsByFamilyUseCase: { execute: ReturnType<typeof vi.fn> };
};

const makeUseCase = (accounts: AccountWithFiat[] = [base]): Mocks => {
  const loggerFactory = (() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })) as unknown as Factory<LoggerPublisher>;

  const fetchAccountsWithBalanceUseCase = {
    execute: vi.fn().mockReturnValue(of(accounts)),
  };
  const fetchAccountsWithFiatUseCase = {
    execute: vi.fn((input: AccountWithFiat[]) => of(input)),
  };
  const sortAccountsByFiatUseCase = {
    execute: vi.fn((input$: Observable<AccountWithFiat[]>) => input$),
  };
  const filterAccountsByFamilyUseCase = {
    execute: vi.fn(
      (input$: Observable<AccountWithFiat[]>, _family?: BlockchainFamily) =>
        input$,
    ),
  };

  const useCase = new ObserveAccountsWithFiatUseCase(
    loggerFactory,
    fetchAccountsWithBalanceUseCase as unknown as FetchAccountsWithBalanceUseCase,
    fetchAccountsWithFiatUseCase as unknown as FetchAccountsWithFiatUseCase,
    sortAccountsByFiatUseCase as unknown as SortAccountsByFiatUseCase,
    filterAccountsByFamilyUseCase as unknown as FilterAccountsByFamilyUseCase,
  );

  return {
    useCase,
    fetchAccountsWithBalanceUseCase,
    fetchAccountsWithFiatUseCase,
    sortAccountsByFiatUseCase,
    filterAccountsByFamilyUseCase,
  };
};

describe("ObserveAccountsWithFiatUseCase", () => {
  it("builds the account pipeline on first call and forwards the family to the filter", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute({ family: "solana" });

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(mocks.filterAccountsByFamilyUseCase.execute).toHaveBeenCalledWith(
      expect.anything(),
      "solana",
    );
  });

  it("reuses the cached stream when called again without forceRefresh", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute();
    mocks.useCase.execute();

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(
      mocks.filterAccountsByFamilyUseCase.execute,
    ).toHaveBeenLastCalledWith(expect.anything(), undefined);
  });

  it("rebuilds the pipeline when forceRefresh is set", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute();
    mocks.useCase.execute({ forceRefresh: true });

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      2,
    );
  });
});

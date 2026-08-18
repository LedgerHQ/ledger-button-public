import { type Factory } from "inversify";
import { type Observable, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { AccountWithFiat } from "@api/model/Account";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase";
import type { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase";
import { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase";
import type { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase";

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

  const useCase = new ObserveAccountsWithFiatUseCase(
    loggerFactory,
    fetchAccountsWithBalanceUseCase as unknown as FetchAccountsWithBalanceUseCase,
    fetchAccountsWithFiatUseCase as unknown as FetchAccountsWithFiatUseCase,
    sortAccountsByFiatUseCase as unknown as SortAccountsByFiatUseCase,
  );

  return {
    useCase,
    fetchAccountsWithBalanceUseCase,
    fetchAccountsWithFiatUseCase,
    sortAccountsByFiatUseCase,
  };
};

describe("ObserveAccountsWithFiatUseCase", () => {
  it("builds the account pipeline on first call and forwards the family to the balance fetch", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute({ family: "solana" });

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ family: "solana" }),
    );
  });

  it("reuses the cached stream when called again with the same family", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute();
    mocks.useCase.execute();

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
  });

  it("builds a distinct pipeline per family", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute({ family: "ethereum" });
    mocks.useCase.execute({ family: "solana" });
    mocks.useCase.execute({ family: "ethereum" });

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      2,
    );
  });

  it("rebuilds all pipelines when forceRefresh is set", () => {
    const mocks = makeUseCase();

    mocks.useCase.execute({ family: "ethereum" });
    mocks.useCase.execute({ family: "ethereum", forceRefresh: true });

    expect(mocks.fetchAccountsWithBalanceUseCase.execute).toHaveBeenCalledTimes(
      2,
    );
  });
});

import { BehaviorSubject, firstValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type {
  Account,
  AccountWithFiat,
  Network,
} from "@api/model/Account";
import type { ButtonCoreContext } from "@api/model/ButtonCoreContext";
import type { ContextService } from "@internal/context/ContextService";

import type { BuildNetworksUseCase } from "./buildNetworksUseCase";
import type { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase";
import { ObserveNetworksForSelectedAddressUseCase } from "./observeNetworksForSelectedAddressUseCase";

function createAccount(
  overrides: Partial<AccountWithFiat> = {},
): AccountWithFiat {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xaaa",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: "1",
    tokens: [],
    fiatBalance: undefined,
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loaded",
    ...overrides,
  };
}

function createContext(selected?: Account): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: selected
      ? new Map<BlockchainFamily, Account>([["ethereum", selected]])
      : new Map(),
    activeFamily: selected ? "ethereum" : undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: true,
    hasTrackingConsent: undefined,
    hasDeveloperMode: false,
    isMobilePlatform: false,
    preferredFiatCurrency: "USD",
  };
}

describe("ObserveNetworksForSelectedAddressUseCase", () => {
  let context$: BehaviorSubject<ButtonCoreContext>;
  let contextService: { observeContext: () => typeof context$ };
  let observeAccountsWithFiatUseCase: { execute: ReturnType<typeof vi.fn> };
  let buildNetworksUseCase: { execute: ReturnType<typeof vi.fn> };
  let useCase: ObserveNetworksForSelectedAddressUseCase;

  function makeUseCase(
    accounts: AccountWithFiat[],
    selected: Account | null = createAccount(),
  ) {
    context$ = new BehaviorSubject(createContext(selected ?? undefined));
    contextService = { observeContext: () => context$ };
    observeAccountsWithFiatUseCase = {
      execute: vi.fn().mockReturnValue(of(accounts)),
    };
    buildNetworksUseCase = {
      execute: vi
        .fn()
        .mockImplementation((input: AccountWithFiat[]) =>
          Promise.resolve(
            input.map((account): Network => ({
              id: account.currencyId,
              name: account.currencyId,
              ticker: account.ticker,
              balance: account.balance,
              fiatBalance: account.fiatBalance,
            })),
          ),
        ),
    };

    useCase = new ObserveNetworksForSelectedAddressUseCase(
      contextService as unknown as ContextService,
      observeAccountsWithFiatUseCase as unknown as ObserveAccountsWithFiatUseCase,
      buildNetworksUseCase as unknown as BuildNetworksUseCase,
    );
  }

  it("should only build networks for accounts sharing the selected address", async () => {
    makeUseCase([
      createAccount({ id: "a", freshAddress: "0xaaa", currencyId: "ethereum" }),
      createAccount({ id: "b", freshAddress: "0xaaa", currencyId: "polygon" }),
      createAccount({ id: "c", freshAddress: "0xbbb", currencyId: "bsc" }),
    ]);

    const networks = await firstValueFrom(useCase.execute());

    expect(networks.map((network) => network.id)).toEqual([
      "ethereum",
      "polygon",
    ]);
  });

  it("should delegate the enrichment and sorting to BuildNetworksUseCase", async () => {
    const matching = createAccount({ freshAddress: "0xaaa" });
    makeUseCase([matching]);

    await firstValueFrom(useCase.execute());

    expect(buildNetworksUseCase.execute).toHaveBeenCalledWith([matching]);
  });

  it("should emit an empty array when no account is selected", async () => {
    makeUseCase([createAccount()], null);

    expect(await firstValueFrom(useCase.execute())).toEqual([]);
    expect(observeAccountsWithFiatUseCase.execute).not.toHaveBeenCalled();
  });

  it("should emit an empty array when no account matches the selected address", async () => {
    makeUseCase([createAccount({ freshAddress: "0xother" })]);

    expect(await firstValueFrom(useCase.execute())).toEqual([]);
    expect(buildNetworksUseCase.execute).not.toHaveBeenCalled();
  });

  it("should ignore context emissions that do not change the selected address", async () => {
    makeUseCase([createAccount({ freshAddress: "0xaaa" })]);

    const emissions: Network[][] = [];
    const subscription = useCase
      .execute()
      .subscribe((networks) => emissions.push(networks));

    await vi.waitFor(() => expect(emissions).toHaveLength(1));

    context$.next({ ...createContext(createAccount()), chainId: 137 });

    expect(emissions).toHaveLength(1);
    subscription.unsubscribe();
  });
});

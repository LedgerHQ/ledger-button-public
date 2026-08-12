import { Maybe } from "purify-ts";
import { beforeEach, describe, expect, it, test, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { Account } from "@api/model/Account.js";
import type { ButtonCoreContext } from "@api/model/ButtonCoreContext.js";
import { aCurrencyDescriptor } from "../blockchain-provider/__mocks__/currencyDescriptorMock.js";
import type { BlockchainProviderManager } from "../blockchain-provider/service/BlockchainProviderManager.js";

import { DEFAULT_FIAT_CURRENCY } from "../currency/constant.js";
import type { Device } from "../device/model/Device.js";
import type { LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { DefaultContextService } from "./DefaultContextService.js";

describe("DefaultContextService", () => {
  let service: DefaultContextService;
  let mockLogger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let mockLoggerFactory: ReturnType<typeof vi.fn>;
  let mockBlockchainProviderManager: BlockchainProviderManager;

  const mockDevice = {
    id: "device-123",
    name: "Nano X",
    modelId: "nanoX",
  } as unknown as Device;

  const mockAccount = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    currencyId: "ethereum",
    name: "Account 1",
    balance: "1000000000000000000",
  } as unknown as Account;

  const mockAccountPolygon = {
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    currencyId: "polygon",
    name: "Polygon Account",
    balance: "5000000000000000000",
  } as unknown as Account;

  const chainIdMap: Record<string, number> = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
  };

  const currencyIdByChainId: Record<string, string> = {
    "1": "ethereum",
    "137": "polygon",
    "42161": "arbitrum",
    "10": "optimism",
  };

  const mockTrustchain = {
    trustChainId: "trustchain-123",
    applicationPath: "/app/path",
  };

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockBlockchainProviderManager = {
      init: vi.fn(),
      setSelectedAccounts: vi.fn(),
      setNetwork: vi.fn(),
      describeCurrency: vi.fn().mockImplementation((currencyId: string) => {
        const chainId = chainIdMap[currencyId];
        return chainId !== undefined
          ? Maybe.of(
              aCurrencyDescriptor({
                currencyId,
                network: {
                  networkId: String(chainId),
                  blockchainName: "ethereum",
                },
              }),
            )
          : Maybe.empty();
      }),
      describeNetwork: vi.fn().mockImplementation((networkId: string) => {
        const currencyId = currencyIdByChainId[networkId];
        return currencyId
          ? Maybe.of(
              aCurrencyDescriptor({
                currencyId,
                network: { networkId, blockchainName: "ethereum" },
              }),
            )
          : Maybe.empty();
      }),
    };

    service = new DefaultContextService(
      mockLoggerFactory as unknown as () => LoggerPublisher,
      (() => mockBlockchainProviderManager) as never,
    );
  });

  describe("getContext", () => {
    it("should return context with default values", () => {
      const context = service.getContext();

      expect(context).toEqual({
        connectedDevice: undefined,
        selectedAccounts: new Map(),
        trustChainId: undefined,
        applicationPath: undefined,
        chainId: 1,
        welcomeScreenCompleted: false,
        hasTrackingConsent: undefined,
        hasDeveloperMode: false,
        isMobilePlatform: false,
        preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
      });
    });
  });

  describe("observeContext", () => {
    it("should return an observable that emits the current context", () => {
      return new Promise<void>((resolve) => {
        const observable = service.observeContext();

        observable.subscribe((context) => {
          expect(context.chainId).toBe(1);
          resolve();
        });
      });
    });
  });

  describe("onEvent", () => {
    test.each([
      {
        eventType: "initialize_context",
        eventArgs: {
          context: {
            connectedDevice: mockDevice,
            selectedAccounts: new Map([["ethereum", mockAccount]]),
            trustChainId: mockTrustchain.trustChainId,
            applicationPath: mockTrustchain.applicationPath,
            chainId: 137,
            welcomeScreenCompleted: false,
            hasTrackingConsent: false,
            hasDeveloperMode: false,
            isMobilePlatform: false,
            preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
          },
        },
        expectedContext: {
          connectedDevice: mockDevice,
          selectedAccounts: new Map([["ethereum", mockAccount]]),
          trustChainId: mockTrustchain.trustChainId,
          applicationPath: mockTrustchain.applicationPath,
          chainId: 137,
          welcomeScreenCompleted: false,
          hasTrackingConsent: false,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "chain_changed",
        eventArgs: { chainId: 42161 },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccounts: new Map(),
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: 42161,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "account_changed",
        eventArgs: { account: mockAccountPolygon, family: "ethereum" },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccounts: new Map([["ethereum", mockAccountPolygon]]),
          activeFamily: "ethereum",
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: chainIdMap.polygon,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "hydrated_account",
        eventArgs: { account: mockAccountPolygon },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccounts: new Map([["ethereum", mockAccountPolygon]]),
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: chainIdMap.polygon,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "device_connected",
        eventArgs: { device: mockDevice },
        expectedContext: {
          connectedDevice: mockDevice,
          selectedAccounts: new Map(),
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: 1,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "device_disconnected",
        eventArgs: {},
        setup: () => {
          service.onEvent({
            type: "device_connected",
            device: mockDevice,
          });
          service.onEvent({
            type: "account_changed",
            account: mockAccount,
            family: "ethereum",
          });
        },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccounts: new Map([["ethereum", mockAccount]]),
          activeFamily: "ethereum",
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: chainIdMap.ethereum,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "trustchain_connected",
        eventArgs: {
          trustChainId: mockTrustchain.trustChainId,
          applicationPath: mockTrustchain.applicationPath,
        },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccounts: new Map(),
          trustChainId: mockTrustchain.trustChainId,
          applicationPath: mockTrustchain.applicationPath,
          chainId: 1,
          welcomeScreenCompleted: false,
          hasTrackingConsent: undefined,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
      {
        eventType: "wallet_disconnected",
        eventArgs: {},
        setup: () => {
          service.onEvent({
            type: "initialize_context",
            context: {
              connectedDevice: mockDevice,
              selectedAccounts: new Map([["ethereum", mockAccount]]),
              activeFamily: "ethereum",
              trustChainId: mockTrustchain.trustChainId,
              applicationPath: mockTrustchain.applicationPath,
              chainId: 137,
              welcomeScreenCompleted: false,
              hasTrackingConsent: false,
              hasDeveloperMode: false,
              isMobilePlatform: false,
              preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
            },
          });
        },
        expectedContext: {
          selectedAccounts: new Map(),
          trustChainId: undefined,
          connectedDevice: undefined,
          applicationPath: undefined,
          chainId: 137,
          welcomeScreenCompleted: false,
          hasTrackingConsent: false,
          hasDeveloperMode: false,
          isMobilePlatform: false,
          preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
        },
      },
    ])("onEvent - $eventType", (event) => {
      if (event.setup) {
        event.setup();
      }

      service.onEvent({
        type: event.eventType,
        ...event.eventArgs,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(service.getContext()).toEqual(event.expectedContext);
    });

    describe("activeFamily", () => {
      const mockSolanaAccount = {
        address: "SoLaNaAddResS1111111111111111111111111111111",
        freshAddress: "SoLaNaAddResS1111111111111111111111111111111",
        currencyId: "solana",
        name: "Solana Account",
      } as unknown as Account;

      it("should set activeFamily to the family of the changed account", () => {
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        expect(service.getContext().activeFamily).toBe("solana");
      });

      it("should update activeFamily to the most recently selected family", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        expect(service.getContext().activeFamily).toBe("solana");
      });

      it("should switch activeFamily on active_family_changed when the family is connected", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        service.onEvent({ type: "active_family_changed", family: "ethereum" });

        expect(service.getContext().activeFamily).toBe("ethereum");
      });

      it("should ignore active_family_changed for a family without a selected account", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });

        service.onEvent({ type: "active_family_changed", family: "solana" });

        expect(service.getContext().activeFamily).toBe("ethereum");
      });

      it("should fall back to a remaining family when the active one is disconnected", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        service.onEvent({ type: "account_disconnected", family: "solana" });

        expect(service.getContext().activeFamily).toBe("ethereum");
      });

      it("should clear activeFamily when the last family is disconnected", () => {
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        service.onEvent({ type: "account_disconnected", family: "solana" });

        expect(service.getContext().activeFamily).toBeUndefined();
      });

      it("should emit a distinct snapshot on every event so consumers detect the switch", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        const emissions: BlockchainFamily[] = [];
        const references: ButtonCoreContext[] = [];
        const subscription = service.observeContext().subscribe((ctx) => {
          references.push(ctx);
          if (ctx.activeFamily) {
            emissions.push(ctx.activeFamily);
          }
        });

        service.onEvent({ type: "active_family_changed", family: "ethereum" });

        subscription.unsubscribe();

        // Last emitted snapshot reflects the switch...
        expect(emissions.at(-1)).toBe("ethereum");
        // ...and is a different object reference than the previous one, so a
        // downstream `distinctUntilChanged` can detect the change.
        expect(references.at(-1)).not.toBe(references.at(-2));
      });

      it("should not mutate previously emitted snapshots when a later event fires", () => {
        service.onEvent({
          type: "account_changed",
          account: mockAccount,
          family: "ethereum",
        });
        service.onEvent({
          type: "account_changed",
          account: mockSolanaAccount,
          family: "solana",
        });

        const snapshots: ButtonCoreContext[] = [];
        const subscription = service
          .observeContext()
          .subscribe((ctx) => snapshots.push(ctx));

        // Snapshot observed before the switch: active family is "solana".
        const before = snapshots.at(-1);
        expect(before?.activeFamily).toBe("solana");

        service.onEvent({ type: "active_family_changed", family: "ethereum" });

        subscription.unsubscribe();

        // The earlier snapshot must NOT be mutated retroactively by the switch,
        // otherwise a downstream `distinctUntilChanged` would compare two equal
        // objects and wrongly suppress the emission.
        expect(before?.activeFamily).toBe("solana");
        expect(snapshots.at(-1)?.activeFamily).toBe("ethereum");
        expect(before).not.toBe(snapshots.at(-1));
      });
    });

    describe("welcome_screen_completed event", () => {
      it("should set welcomeScreenCompleted to true", () => {
        expect(service.getContext().welcomeScreenCompleted).toBe(false);

        service.onEvent({ type: "welcome_screen_completed" });

        expect(service.getContext().welcomeScreenCompleted).toBe(true);
      });
    });

    describe("developer_mode_enabled event", () => {
      it("should set hasDeveloperMode to true", () => {
        expect(service.getContext().hasDeveloperMode).toBe(false);

        service.onEvent({ type: "developer_mode_enabled" });

        expect(service.getContext().hasDeveloperMode).toBe(true);
      });
    });

    describe("tracking_consent_given event", () => {
      it("should set hasTrackingConsent to true", () => {
        expect(service.getContext().hasTrackingConsent).toBe(undefined);

        service.onEvent({ type: "tracking_consent_given" });

        expect(service.getContext().hasTrackingConsent).toBe(true);
      });
    });

    describe("tracking_consent_refused event", () => {
      it("should set hasTrackingConsent to false", () => {
        // Give consent
        service.onEvent({ type: "tracking_consent_given" });
        expect(service.getContext().hasTrackingConsent).toBe(true);

        // Refuse consent
        service.onEvent({ type: "tracking_consent_refused" });

        expect(service.getContext().hasTrackingConsent).toBe(false);
      });

      it("should set hasTrackingConsent to false from undefined", () => {
        expect(service.getContext().hasTrackingConsent).toBe(undefined);

        service.onEvent({ type: "tracking_consent_refused" });

        expect(service.getContext().hasTrackingConsent).toBe(false);
      });
    });

    describe("preferred_fiat_currency_changed event", () => {
      it("should set preferredFiatCurrency to the given currency", () => {
        expect(service.getContext().preferredFiatCurrency).toBe(
          DEFAULT_FIAT_CURRENCY,
        );

        service.onEvent({
          type: "preferred_fiat_currency_changed",
          currency: "eur",
        });

        expect(service.getContext().preferredFiatCurrency).toBe("eur");
      });

      it("should update preferredFiatCurrency when changed again", () => {
        service.onEvent({
          type: "preferred_fiat_currency_changed",
          currency: "usd",
        });
        service.onEvent({
          type: "preferred_fiat_currency_changed",
          currency: "gbp",
        });

        expect(service.getContext().preferredFiatCurrency).toBe("gbp");
      });
    });
  });
});

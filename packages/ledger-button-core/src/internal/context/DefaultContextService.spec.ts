import { beforeEach, describe, expect, it, test, vi } from "vitest";

import type { Account } from "../account/service/AccountService.js";
import * as chainUtils from "../blockchain/evm/chainUtils.js";
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

    vi.spyOn(chainUtils, "getChainIdFromCurrencyId").mockImplementation(
      (currencyId: string) => chainIdMap[currencyId] || 1,
    );

    service = new DefaultContextService(
      mockLoggerFactory as unknown as () => LoggerPublisher,
    );
  });

  describe("getContext", () => {
    it("should return context with default values", () => {
      const context = service.getContext();

      expect(context).toEqual({
        connectedDevice: undefined,
        selectedAccount: undefined,
        trustChainId: undefined,
        applicationPath: undefined,
        chainId: 1,
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
            selectedAccount: mockAccount,
            trustChainId: mockTrustchain.trustChainId,
            applicationPath: mockTrustchain.applicationPath,
            chainId: 137,
          },
        },
        expectedContext: {
          connectedDevice: mockDevice,
          selectedAccount: mockAccount,
          trustChainId: mockTrustchain.trustChainId,
          applicationPath: mockTrustchain.applicationPath,
          chainId: 137,
        },
      },
      {
        eventType: "chain_changed",
        eventArgs: { chainId: 42161 },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccount: undefined,
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: 42161,
        },
      },
      {
        eventType: "account_changed",
        eventArgs: { account: mockAccountPolygon },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccount: mockAccountPolygon,
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: chainIdMap.polygon,
        },
      },
      {
        eventType: "device_connected",
        eventArgs: { device: mockDevice },
        expectedContext: {
          connectedDevice: mockDevice,
          selectedAccount: undefined,
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: 1,
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
          });
        },
        expectedContext: {
          connectedDevice: undefined,
          selectedAccount: undefined,
          trustChainId: undefined,
          applicationPath: undefined,
          chainId: chainIdMap.ethereum,
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
          selectedAccount: undefined,
          trustChainId: mockTrustchain.trustChainId,
          applicationPath: mockTrustchain.applicationPath,
          chainId: 1,
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
              selectedAccount: mockAccount,
              trustChainId: mockTrustchain.trustChainId,
              applicationPath: mockTrustchain.applicationPath,
              chainId: 137,
            },
          });
        },
        expectedContext: {
          selectedAccount: undefined,
          trustChainId: undefined,
          connectedDevice: undefined,
          applicationPath: undefined,
          chainId: 137,
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
  });
});

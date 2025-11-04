import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ButtonCoreContext } from "../../api/model/ButtonCoreContext.js";
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

  describe("onEvent - initialize_context", () => {
    it("should replace the entire context with the provided context", () => {
      const newContext: ButtonCoreContext = {
        connectedDevice: mockDevice,
        selectedAccount: mockAccount,
        trustChainId: mockTrustchain.trustChainId,
        applicationPath: mockTrustchain.applicationPath,
        chainId: 137,
      };

      service.onEvent({
        type: "initialize_context",
        context: newContext,
      });

      expect(service.getContext()).toEqual(newContext);
    });
  });

  describe("onEvent - chain_changed", () => {
    it("should only update chainId in the context", () => {
      service.onEvent({
        type: "device_connected",
        device: mockDevice,
      });

      service.onEvent({
        type: "chain_changed",
        chainId: 42161,
      });
      const context = service.getContext();
      expect(context.connectedDevice).toEqual(mockDevice);
      expect(context.chainId).toBe(42161);
    });
  });

  describe("onEvent - account_changed", () => {
    it("should update selectedAccount and chainId based on account's currencyId", () => {
      service.onEvent({
        type: "device_connected",
        device: mockDevice,
      });

      service.onEvent({
        type: "account_changed",
        account: mockAccountPolygon,
      });

      const context = service.getContext();
      expect(context.selectedAccount).toEqual(mockAccountPolygon);
      expect(context.chainId).toBe(chainIdMap.polygon);
      expect(context.connectedDevice).toEqual(mockDevice);
    });
  });

  describe("onEvent - device_connected", () => {
    it("should update connectedDevice in the context", () => {
      service.onEvent({
        type: "device_connected",
        device: mockDevice,
      });

      const context = service.getContext();
      expect(context.connectedDevice).toEqual(mockDevice);
    });
  });

  describe("onEvent - device_disconnected", () => {
    it("should clear connectedDevice and selectedAccount from the context", () => {
      service.onEvent({
        type: "device_connected",
        device: mockDevice,
      });
      service.onEvent({
        type: "account_changed",
        account: mockAccount,
      });

      service.onEvent({
        type: "device_disconnected",
      });

      const context = service.getContext();
      expect(context.connectedDevice).toBeUndefined();
      expect(context.selectedAccount).toBeUndefined();
    });

    it("should preserve trustchain properties when device is disconnected", () => {
      service.onEvent({
        type: "trustchain_connected",
        trustChainId: mockTrustchain.trustChainId,
        applicationPath: mockTrustchain.applicationPath,
      });
      service.onEvent({
        type: "device_connected",
        device: mockDevice,
      });

      service.onEvent({
        type: "device_disconnected",
      });

      const context = service.getContext();
      expect(context.connectedDevice).toBeUndefined();
      expect(context.trustChainId).toBe(mockTrustchain.trustChainId);
      expect(context.applicationPath).toBe(mockTrustchain.applicationPath);
    });
  });

  describe("onEvent - trustchain_connected", () => {
    it("should update trustChainId and applicationPath in the context", () => {
      service.onEvent({
        type: "trustchain_connected",
        trustChainId: mockTrustchain.trustChainId,
        applicationPath: mockTrustchain.applicationPath,
      });

      const context = service.getContext();
      expect(context.trustChainId).toBe(mockTrustchain.trustChainId);
      expect(context.applicationPath).toBe(mockTrustchain.applicationPath);
    });
  });

  describe("onEvent - wallet_disconnected", () => {
    it("should clear all context properties except chainId", () => {
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

      service.onEvent({
        type: "wallet_disconnected",
      });

      const context = service.getContext();
      expect(context).toStrictEqual({
        selectedAccount: undefined,
        trustChainId: undefined,
        connectedDevice: undefined,
        applicationPath: undefined,
        chainId: 137,
      });
    });
  });
});

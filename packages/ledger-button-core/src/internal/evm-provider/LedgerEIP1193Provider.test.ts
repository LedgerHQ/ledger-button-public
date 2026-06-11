/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommonEIP1193ErrorCode } from "../../api/model/eip/EIPTypes.js";
import { Account } from "../account/service/AccountService.js";
import type { WalletProviderHost } from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";

const EVM_ADDRESS = "0x1234567890123456789012345678901234567890";

const createAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    id: "evm:1",
    currencyId: "ethereum",
    freshAddress: EVM_ADDRESS,
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    name: "Ethereum 1",
    ticker: "ETH",
    balance: undefined,
    tokens: [],
    ...overrides,
  }) as Account;

const createMockHost = (): {
  [K in keyof WalletProviderHost]: ReturnType<typeof vi.fn>;
} => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("LedgerEIP1193Provider", () => {
  let provider: LedgerEIP1193Provider;
  let host: ReturnType<typeof createMockHost>;

  beforeEach(() => {
    vi.clearAllMocks();
    host = createMockHost();
    provider = new LedgerEIP1193Provider(host as unknown as WalletProviderHost);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct properties", () => {
      expect(provider.isLedgerButton).toBe(true);
      expect(provider.isConnected()).toBe(false);
    });
  });

  describe("on / removeListener", () => {
    it("should add and invoke a listener for custom events", () => {
      const listener = vi.fn();
      provider.on("connect", listener);
      provider.dispatchEvent(
        new CustomEvent("connect", { detail: { chainId: "0x1" } }),
      );
      expect(listener).toHaveBeenCalledWith({ chainId: "0x1" });
    });

    it("should remove a listener", () => {
      const listener = vi.fn();
      provider.on("connect", listener);
      expect(provider["_listeners"].has(listener as any)).toBe(true);
      provider.removeListener("connect", listener);
      expect(provider["_listeners"].has(listener as any)).toBe(false);
    });

    it("should return the provider instance for chaining", () => {
      const listener = vi.fn();
      expect(provider.on("connect", listener)).toBe(provider);
      expect(provider.removeListener("connect", listener)).toBe(provider);
    });
  });

  describe("connect", () => {
    it("should set connected status and dispatch a connect event", async () => {
      const listener = vi.fn();
      provider.on("connect", listener);

      await provider.connect();

      expect(provider.isConnected()).toBe(true);
      expect(listener).toHaveBeenCalledWith({ chainId: "0x1" });
    });

    it("should not connect multiple times", async () => {
      const listener = vi.fn();
      provider.on("connect", listener);

      await provider.connect();
      await provider.connect();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("request", () => {
    it("should reject a blocking request while another is in flight", async () => {
      // Hold the first blocking request open via a never-resolving host call.
      host.requestAccount.mockReturnValue(new Promise(() => undefined));
      void provider.request({ method: "eth_requestAccounts", params: [] });

      await expect(
        provider.request({ method: "eth_requestAccounts", params: [] }),
      ).rejects.toHaveProperty("code", CommonEIP1193ErrorCode.InternalError);
    });

    it("should reject an unsupported method", async () => {
      await expect(
        provider.request({ method: "unsupported_method" as any, params: [] }),
      ).rejects.toHaveProperty(
        "code",
        CommonEIP1193ErrorCode.UnsupportedMethod,
      );
    });

    it("should route non-blocking methods to host.broadcastRPC", async () => {
      const response = { jsonrpc: "2.0", id: 0, result: "0x123" };
      host.broadcastRPC.mockResolvedValue(response);

      const result = await provider.request({
        method: "eth_call",
        params: [],
      });

      expect(result).toBe(response);
      expect(host.broadcastRPC).toHaveBeenCalledWith(
        expect.objectContaining({ method: "eth_call" }),
      );
    });

    it("should allow non-blocking methods even when disconnected", async () => {
      host.broadcastRPC.mockResolvedValue({
        jsonrpc: "2.0",
        id: 0,
        result: "0x0",
      });

      await provider.request({ method: "eth_getBalance", params: [] });

      expect(host.broadcastRPC).toHaveBeenCalled();
    });

    it("should reject handler methods when disconnected", async () => {
      await expect(
        provider.request({ method: "eth_accounts", params: [] }),
      ).rejects.toHaveProperty("code", CommonEIP1193ErrorCode.Unauthorized);
    });

    it("should return the selected account for eth_accounts", async () => {
      provider.setSelectedAccount(createAccount());

      const result = await provider.request({
        method: "eth_accounts",
        params: [],
      });

      expect(result).toEqual([EVM_ADDRESS]);
    });

    it("should request an account via the host for eth_requestAccounts", async () => {
      host.requestAccount.mockResolvedValue(createAccount());

      const result = await provider.request({
        method: "eth_requestAccounts",
        params: [],
      });

      expect(host.requestAccount).toHaveBeenCalledWith("evm");
      expect(result).toEqual([EVM_ADDRESS]);
    });
  });

  describe("setSelectedAccount / setNetwork", () => {
    it("should connect and emit accountsChanged when an account is pushed", () => {
      const listener = vi.fn();
      provider.on("accountsChanged", listener);

      provider.setSelectedAccount(createAccount());

      expect(provider.isConnected()).toBe(true);
      expect(listener).toHaveBeenCalledWith([EVM_ADDRESS]);
    });

    it("should disconnect when undefined is pushed", () => {
      provider.setSelectedAccount(createAccount());
      provider.setSelectedAccount(undefined);
      expect(provider.isConnected()).toBe(false);
    });

    it("should emit chainChanged when the network changes", () => {
      const listener = vi.fn();
      provider.on("chainChanged", listener);

      provider.setNetwork(137);

      expect(listener).toHaveBeenCalledWith("0x89");
    });
  });

  describe("disconnect", () => {
    it("should not call host.disconnect when already disconnected", async () => {
      await provider.disconnect();
      expect(host.disconnect).not.toHaveBeenCalled();
    });

    it("should call host.disconnect and dispatch a disconnect event when connected", async () => {
      await provider.connect();
      const listener = vi.fn();
      provider.on("disconnect", listener);

      await provider.disconnect();

      expect(host.disconnect).toHaveBeenCalled();
      expect(provider.isConnected()).toBe(false);
      expect(listener.mock.calls[0][0]).toHaveProperty("code", 1000);
      expect(listener.mock.calls[0][0]).toHaveProperty(
        "message",
        "Provider disconnected",
      );
    });

    it("should use a custom disconnect code and message", async () => {
      await provider.connect();
      const listener = vi.fn();
      provider.on("disconnect", listener);

      await provider.disconnect(4001, "Custom disconnect message");

      expect(listener.mock.calls[0][0]).toHaveProperty("code", 4001);
      expect(listener.mock.calls[0][0]).toHaveProperty(
        "message",
        "Custom disconnect message",
      );
    });
  });
});

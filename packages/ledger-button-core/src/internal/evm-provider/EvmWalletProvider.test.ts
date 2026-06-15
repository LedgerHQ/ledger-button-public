/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Account } from "../account/service/AccountService.js";
import type {
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProviderHost,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";

vi.mock("./LedgerEIP1193Provider.js", () => ({
  LedgerEIP1193Provider: vi.fn().mockImplementation(() => ({
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

const createMockHost = (): WalletProviderHost => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("EvmWalletProvider", () => {
  let host: WalletProviderHost;

  beforeEach(() => {
    vi.clearAllMocks();
    host = createMockHost();
  });

  test('family is "evm"', () => {
    expect(new EvmWalletProvider(host).family).toBe("evm");
  });

  describe("constructor", () => {
    test("passes host as first arg to LedgerEIP1193Provider", () => {
      new EvmWalletProvider(host);

      expect(LedgerEIP1193Provider).toHaveBeenCalledWith(host, expect.any(Function));
    });

    test("loadRpcMethods loader resolves rpcMethods from configFactory", async () => {
      const rpcMethods: ProviderDAppConfig["rpcMethods"] = {
        local: ["eth_call"],
        broadcasted: ["eth_sendRawTransaction"],
      };
      const configFactory: ProviderDAppConfigFactory = vi
        .fn()
        .mockResolvedValue({ rpcMethods } as ProviderDAppConfig);

      new EvmWalletProvider(host, configFactory);

      const loadRpcMethods = vi.mocked(LedgerEIP1193Provider).mock.calls[0]?.[1];
      await expect(loadRpcMethods?.()).resolves.toEqual(rpcMethods);
    });

    test("loadRpcMethods loader resolves to undefined when no configFactory provided", async () => {
      new EvmWalletProvider(host);

      const loadRpcMethods = vi.mocked(LedgerEIP1193Provider).mock.calls[0]?.[1];
      await expect(loadRpcMethods?.()).resolves.toBeUndefined();
    });
  });

  describe("init()", () => {
    let announced: CustomEvent[];

    beforeEach(() => {
      announced = [];
      const onAnnounce = (event: Event) => announced.push(event as CustomEvent);
      window.addEventListener("eip6963:announceProvider", onAnnounce);
      return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
    });

    test("announces an EIP-6963 provider immediately", () => {
      const teardown = new EvmWalletProvider(host).init();

      expect(announced).toHaveLength(1);
      expect(announced[0]?.detail.info).toMatchObject({
        name: "Ledger Wallet",
        rdns: "com.ledger.wallet.provider",
      });

      teardown();
    });

    test("provider info includes a non-empty UUID string", () => {
      const teardown = new EvmWalletProvider(host).init();

      expect(announced[0]?.detail.info.uuid).toBeTypeOf("string");
      expect(announced[0]?.detail.info.uuid).not.toBe("");

      teardown();
    });

    test("provider detail is frozen", () => {
      const teardown = new EvmWalletProvider(host).init();

      expect(Object.isFrozen(announced[0]?.detail)).toBe(true);

      teardown();
    });

    test("announced provider is the LedgerEIP1193Provider instance", () => {
      const evmProvider = new EvmWalletProvider(host);
      const teardown = evmProvider.init();

      expect(announced[0]?.detail.provider).toBe(evmProvider.getEip1193Provider());

      teardown();
    });

    test("re-announces when a dApp requests providers", () => {
      const teardown = new EvmWalletProvider(host).init();
      announced.length = 0;

      window.dispatchEvent(new Event("eip6963:requestProvider"));

      expect(announced).toHaveLength(1);

      teardown();
    });

    test("stops re-announcing after teardown", () => {
      const teardown = new EvmWalletProvider(host).init();
      teardown();
      announced.length = 0;

      window.dispatchEvent(new Event("eip6963:requestProvider"));

      expect(announced).toHaveLength(0);
    });

    test("icon is a dark SVG data URI when prefers-color-scheme is dark", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);

      const teardown = new EvmWalletProvider(host).init();
      const icon = announced[0]?.detail.info.icon as string;

      expect(icon).toMatch(/^data:image\/svg\+xml;base64,/);
      // White glyph SVG contains fill:#FFFFFF; black glyph contains fill:#000000
      expect(atob(icon.replace("data:image/svg+xml;base64,", ""))).toContain("fill:#FFFFFF");

      teardown();
    });

    test("icon is a light SVG data URI when prefers-color-scheme is not dark", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);

      const teardown = new EvmWalletProvider(host).init();
      const icon = announced[0]?.detail.info.icon as string;

      expect(icon).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(atob(icon.replace("data:image/svg+xml;base64,", ""))).toContain("fill:#000000");

      teardown();
    });
  });

  describe("setSelectedAccount()", () => {
    test("delegates to LedgerEIP1193Provider", () => {
      const evmProvider = new EvmWalletProvider(host);
      const account = { id: "evm:1" } as unknown as Account;

      evmProvider.setSelectedAccount(account);

      expect(evmProvider.getEip1193Provider().setSelectedAccount).toHaveBeenCalledWith(account);
    });

    test("delegates undefined on disconnect", () => {
      const evmProvider = new EvmWalletProvider(host);

      evmProvider.setSelectedAccount(undefined);

      expect(evmProvider.getEip1193Provider().setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("delegates chain id to LedgerEIP1193Provider", () => {
      const evmProvider = new EvmWalletProvider(host);

      evmProvider.setNetwork(1);

      expect(evmProvider.getEip1193Provider().setNetwork).toHaveBeenCalledWith(1);
    });
  });

  describe("getEip1193Provider()", () => {
    test("returns the same LedgerEIP1193Provider instance every time", () => {
      const evmProvider = new EvmWalletProvider(host);

      expect(evmProvider.getEip1193Provider()).toBe(evmProvider.getEip1193Provider());
    });
  });

  describe("getDAppConfig()", () => {
    test("calls configFactory with evm family", async () => {
      const configFactory: ProviderDAppConfigFactory = vi.fn().mockResolvedValue(undefined);
      const evmProvider = new EvmWalletProvider(host, configFactory);

      await evmProvider.getDAppConfig();

      expect(configFactory).toHaveBeenCalledWith("evm");
    });

    test("returns undefined when no configFactory is provided", async () => {
      await expect(new EvmWalletProvider(host).getDAppConfig()).resolves.toBeUndefined();
    });
  });
});

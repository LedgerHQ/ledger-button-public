/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { registerWalletStandard } from "./utils/registerWalletStandard.js";
import type { Account } from "../account/service/AccountService.js";
import type {
  ProviderDAppConfigFactory,
  WalletProviderHost,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

vi.mock("./LedgerSolanaWallet.js", () => ({
  LedgerSolanaWallet: vi.fn().mockImplementation(() => ({
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
    features: {
      "standard:disconnect": {
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
    },
  })),
}));

vi.mock("./utils/registerWalletStandard.js", () => ({
  registerWalletStandard: vi.fn().mockReturnValue(vi.fn()),
}));

const createMockHost = (): WalletProviderHost => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("SolanaWalletProvider", () => {
  let host: WalletProviderHost;

  beforeEach(() => {
    vi.clearAllMocks();
    host = createMockHost();
  });

  test('family is "solana"', () => {
    expect(new SolanaWalletProvider(host).family).toBe("solana");
  });

  describe("constructor", () => {
    test("passes host to LedgerSolanaWallet", () => {
      new SolanaWalletProvider(host);

      expect(LedgerSolanaWallet).toHaveBeenCalledWith(host);
    });
  });

  describe("init()", () => {
    test("registers the wallet via registerWalletStandard", () => {
      const provider = new SolanaWalletProvider(host);
      const teardown = provider.init();

      expect(registerWalletStandard).toHaveBeenCalledWith(provider.getWallet());

      teardown();
    });

    test("teardown disconnects the wallet and unregisters", () => {
      const unregister = vi.fn();
      vi.mocked(registerWalletStandard).mockReturnValue(unregister);

      const provider = new SolanaWalletProvider(host);
      const wallet = provider.getWallet();
      const teardown = provider.init();

      teardown();

      expect(
        wallet.features["standard:disconnect"].disconnect,
      ).toHaveBeenCalled();
      expect(unregister).toHaveBeenCalled();
    });
  });

  describe("setSelectedAccount()", () => {
    test("delegates to LedgerSolanaWallet", () => {
      const provider = new SolanaWalletProvider(host);
      const account = { id: "solana:1" } as unknown as Account;

      provider.setSelectedAccount(account);

      expect(provider.getWallet().setSelectedAccount).toHaveBeenCalledWith(
        account,
      );
    });

    test("delegates undefined on disconnect", () => {
      const provider = new SolanaWalletProvider(host);

      provider.setSelectedAccount(undefined);

      expect(provider.getWallet().setSelectedAccount).toHaveBeenCalledWith(
        undefined,
      );
    });
  });

  describe("setNetwork()", () => {
    test("delegates chain id to LedgerSolanaWallet", () => {
      const provider = new SolanaWalletProvider(host);

      provider.setNetwork(1);

      expect(provider.getWallet().setNetwork).toHaveBeenCalledWith(1);
    });
  });

  describe("getWallet()", () => {
    test("returns the same LedgerSolanaWallet instance every time", () => {
      const provider = new SolanaWalletProvider(host);

      expect(provider.getWallet()).toBe(provider.getWallet());
    });
  });

  describe("getDAppConfig()", () => {
    test("calls configFactory with solana family", async () => {
      const configFactory: ProviderDAppConfigFactory = vi
        .fn()
        .mockResolvedValue(undefined);
      const provider = new SolanaWalletProvider(host, configFactory);

      await provider.getDAppConfig();

      expect(configFactory).toHaveBeenCalledWith("solana");
    });

    test("returns undefined when no configFactory is provided", async () => {
      await expect(
        new SolanaWalletProvider(host).getDAppConfig(),
      ).resolves.toBeUndefined();
    });
  });
});

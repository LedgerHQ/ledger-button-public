import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Account } from "../../account/service/AccountService.js";
import type { CoreFacade } from "../../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";

// System program id: a valid 32-byte base58 address.
const SOLANA_ADDRESS = "11111111111111111111111111111111";

const createAccount = (overrides: Partial<Account> = {}): Account => ({
  id: "solana:1",
  currencyId: "solana",
  freshAddress: SOLANA_ADDRESS,
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  name: "Solana 1",
  ticker: "SOL",
  balance: undefined,
  tokens: [],
  ...overrides,
});

const createMockHost = (): {
  [K in keyof CoreFacade]: ReturnType<typeof vi.fn>;
} => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("LedgerSolanaWallet (connection)", () => {
  let host: ReturnType<typeof createMockHost>;

  const createWallet = () =>
    new LedgerSolanaWallet(host as unknown as CoreFacade);

  beforeEach(() => {
    host = createMockHost();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("advertises only the supported solana:* chains", () => {
      expect(createWallet().chains).toEqual([
        "solana:mainnet",
        "solana:devnet",
        "solana:testnet",
      ]);
    });

    it("exposes connection and signing features", () => {
      const featureNames = Object.keys(createWallet().features);
      expect(featureNames).toEqual([
        "standard:connect",
        "standard:disconnect",
        "standard:events",
        "solana:signMessage",
        "solana:signTransaction",
        "solana:signAndSendTransaction",
      ]);
    });
  });

  describe("connect", () => {
    it("reuses an account pushed by core without calling the host", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      const { accounts } = await wallet.features["standard:connect"].connect();

      expect(host.requestAccount).not.toHaveBeenCalled();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].address).toBe(SOLANA_ADDRESS);
      expect(accounts[0].chains).toEqual(["solana:mainnet"]);
      expect(accounts[0].features).toEqual([
        "solana:signMessage",
        "solana:signTransaction",
        "solana:signAndSendTransaction",
      ]);
      expect(wallet.accounts).toBe(accounts);
    });

    it("requests an account via the host when none is selected", async () => {
      host.requestAccount.mockResolvedValue(createAccount());
      const wallet = createWallet();

      const { accounts } = await wallet.features["standard:connect"].connect();

      expect(host.requestAccount).toHaveBeenCalledWith("solana");
      expect(accounts[0].address).toBe(SOLANA_ADDRESS);
    });

    it("ignores a non-Solana pushed account and falls back to the host", async () => {
      host.requestAccount.mockResolvedValue(createAccount());
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount({ currencyId: "ethereum" }));

      await wallet.features["standard:connect"].connect();

      expect(host.requestAccount).toHaveBeenCalledWith("solana");
    });

    it("rejects when the host returns a non-Solana account", async () => {
      host.requestAccount.mockResolvedValue(
        createAccount({ currencyId: "ethereum" }),
      );

      await expect(
        createWallet().features["standard:connect"].connect(),
      ).rejects.toThrow("Selected account is not a Solana account");
    });

    it("rejects when the host account request fails", async () => {
      host.requestAccount.mockRejectedValue(new Error("boom"));

      await expect(
        createWallet().features["standard:connect"].connect(),
      ).rejects.toThrow("boom");
    });
  });

  describe("events", () => {
    it("emits a change event with the connected accounts", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);

      await wallet.features["standard:connect"].connect();

      expect(listener).toHaveBeenCalledWith({ accounts: wallet.accounts });
    });

    it("stops notifying a listener after it is removed", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      const listener = vi.fn();
      const off = wallet.features["standard:events"].on("change", listener);
      off();

      await wallet.features["standard:connect"].connect();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("clears the connected accounts and emits a change event", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      await wallet.features["standard:disconnect"].disconnect();

      expect(wallet.accounts).toEqual([]);
      expect(listener).toHaveBeenCalledWith({ accounts: [] });
    });
  });
});

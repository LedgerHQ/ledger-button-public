import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerButtonCore } from "../../api/LedgerButtonCore.js";
import { Account } from "../account/service/AccountService.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { SolanaProviderUI } from "./SolanaProviderUI.js";

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

const ACCOUNT_SELECTED_EVENT = "ledger-provider-account-selected";

describe("LedgerSolanaWallet (connection)", () => {
  let core: { getSelectedAccount: ReturnType<typeof vi.fn> };
  let app: SolanaProviderUI & { navigationIntent: ReturnType<typeof vi.fn> };

  const createWallet = () =>
    new LedgerSolanaWallet(
      core as unknown as LedgerButtonCore,
      app as SolanaProviderUI,
    );

  beforeEach(() => {
    core = { getSelectedAccount: vi.fn() };
    app = { isModalOpen: false, navigationIntent: vi.fn() };
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

    it("exposes only connection features (no signing yet)", () => {
      const featureNames = Object.keys(createWallet().features);
      expect(featureNames).toEqual([
        "standard:connect",
        "standard:disconnect",
        "standard:events",
      ]);
      expect(featureNames).not.toContain("solana:signTransaction");
      expect(featureNames).not.toContain("solana:signMessage");
    });
  });

  describe("connect", () => {
    it("reuses the currently selected Solana account without opening the UI", async () => {
      core.getSelectedAccount.mockReturnValue(createAccount());
      const wallet = createWallet();

      const { accounts } = await wallet.features["standard:connect"].connect();

      expect(app.navigationIntent).not.toHaveBeenCalled();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].address).toBe(SOLANA_ADDRESS);
      expect(accounts[0].chains).toEqual(["solana:mainnet"]);
      expect(accounts[0].features).toEqual([]);
      expect(wallet.accounts).toBe(accounts);
    });

    it("opens the account selection UI when no Solana account is selected", async () => {
      core.getSelectedAccount.mockReturnValue(null);
      const account = createAccount();
      app.navigationIntent.mockImplementation(() => {
        window.dispatchEvent(
          new CustomEvent(ACCOUNT_SELECTED_EVENT, {
            detail: { account, status: "success" },
          }),
        );
      });
      const wallet = createWallet();

      const { accounts } = await wallet.features["standard:connect"].connect();

      expect(app.navigationIntent).toHaveBeenCalledWith("selectAccount");
      expect(accounts[0].address).toBe(SOLANA_ADDRESS);
    });

    it("ignores a non-Solana selected account and falls back to the UI", async () => {
      core.getSelectedAccount.mockReturnValue(
        createAccount({ currencyId: "ethereum" }),
      );
      const account = createAccount();
      app.navigationIntent.mockImplementation(() => {
        window.dispatchEvent(
          new CustomEvent(ACCOUNT_SELECTED_EVENT, {
            detail: { account, status: "success" },
          }),
        );
      });

      await createWallet().features["standard:connect"].connect();

      expect(app.navigationIntent).toHaveBeenCalledWith("selectAccount");
    });

    it("rejects when the selected account is not a Solana account", async () => {
      core.getSelectedAccount.mockReturnValue(null);
      app.navigationIntent.mockImplementation(() => {
        window.dispatchEvent(
          new CustomEvent(ACCOUNT_SELECTED_EVENT, {
            detail: {
              account: createAccount({ currencyId: "ethereum" }),
              status: "success",
            },
          }),
        );
      });

      await expect(
        createWallet().features["standard:connect"].connect(),
      ).rejects.toThrow("Selected account is not a Solana account");
    });

    it("rejects when account selection fails", async () => {
      core.getSelectedAccount.mockReturnValue(null);
      app.navigationIntent.mockImplementation(() => {
        window.dispatchEvent(
          new CustomEvent(ACCOUNT_SELECTED_EVENT, {
            detail: { status: "error", error: new Error("boom") },
          }),
        );
      });

      await expect(
        createWallet().features["standard:connect"].connect(),
      ).rejects.toThrow("Account selection failed");
    });
  });

  describe("events", () => {
    it("emits a change event with the connected accounts", async () => {
      core.getSelectedAccount.mockReturnValue(createAccount());
      const wallet = createWallet();
      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);

      await wallet.features["standard:connect"].connect();

      expect(listener).toHaveBeenCalledWith({ accounts: wallet.accounts });
    });

    it("stops notifying a listener after it is removed", async () => {
      core.getSelectedAccount.mockReturnValue(createAccount());
      const wallet = createWallet();
      const listener = vi.fn();
      const off = wallet.features["standard:events"].on("change", listener);
      off();

      await wallet.features["standard:connect"].connect();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("clears the connected accounts and emits a change event", async () => {
      core.getSelectedAccount.mockReturnValue(createAccount());
      const wallet = createWallet();
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      await wallet.features["standard:disconnect"].disconnect();

      expect(wallet.accounts).toEqual([]);
      expect(listener).toHaveBeenCalledWith({ accounts: [] });
    });
  });
});

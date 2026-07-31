import { getBase58Decoder } from "@solana/kit";
import type { WalletAccount } from "@wallet-standard/base";
import { of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import { Account } from "../../account/service/AccountService.js";
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
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
  getLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  })),
  getDeviceSession: vi.fn(() => ({
    dmk: {},
    sessionId: undefined,
    isConnected: false,
  })),
  getSdkConfig: vi.fn(() => ({
    originToken: "test-origin-token",
    dAppIdentifier: "test-dapp",
  })),
  isModalOpen: vi.fn(() => false),
  trackTransactionStarted: vi.fn(),
  trackTransactionCompleted: vi.fn(),
  trackTypedMessageStarted: vi.fn(),
  trackTypedMessageCompleted: vi.fn(),
  estimateGasFromCoinService: vi.fn().mockResolvedValue(undefined),
  emitNavigationIntent: vi.fn(),
  trackBroadcastedTransaction: vi.fn(),
});

const stubWalletAccount = { address: SOLANA_ADDRESS } as WalletAccount;

describe("LedgerSolanaWallet (connection)", () => {
  let host: ReturnType<typeof createMockHost>;
  let signSolanaMessage: { execute: ReturnType<typeof vi.fn> };

  const createWallet = () =>
    new LedgerSolanaWallet(host as unknown as CoreFacade, {
      signSolanaMessage: signSolanaMessage as never,
    });

  beforeEach(() => {
    host = createMockHost();
    signSolanaMessage = {
      execute: vi.fn(),
    };
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
      expect(accounts[0].features).toEqual(["solana:signMessage"]);
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

  describe("signMessage", () => {
    const signatureBytes = new Uint8Array(64).fill(7);
    const signatureBase58 = getBase58Decoder().decode(signatureBytes);
    // The OCM (preamble + content) the device actually signed.
    const signedMessageBytes = new Uint8Array([
      0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63,
      0x68, 0x61, 0x69, 0x6e, 0x01, 0x01, 0x48, 0x69,
    ]);

    it("runs the sign use case through the navigation intent and returns the decoded signature and signed OCM", async () => {
      signSolanaMessage.execute.mockReturnValue(
        of({
          signType: "solana-message",
          status: "success",
          data: {
            signature: signatureBase58,
            signedMessage: signedMessageBytes,
          },
        }),
      );
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      const message = new TextEncoder().encode("hello");

      const [result] = await wallet.features["solana:signMessage"].signMessage({
        account: stubWalletAccount,
        message,
      });

      expect(host.emitNavigationIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "signTransaction",
          params: {
            kind: "solana-message",
            address: SOLANA_ADDRESS,
            message,
          },
        }),
      );
      expect(signSolanaMessage.execute).toHaveBeenCalledWith(
        {
          kind: "solana-message",
          address: SOLANA_ADDRESS,
          message,
        },
        createAccount(),
      );
      expect(result.signedMessage).toBe(signedMessageBytes);
      expect(result.signature).toEqual(signatureBytes);
      expect(result.signatureType).toBe("ed25519");
    });
  });
});

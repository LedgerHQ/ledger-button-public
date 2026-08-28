import type { Account } from "@ledgerhq/ledger-wallet-provider-core";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignFlowStatus } from "@ledgerhq/ledger-wallet-provider-core";
import { getBase58Decoder, getBase64Decoder } from "@solana/kit";
import type { WalletAccount } from "@wallet-standard/base";
import { of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SignSolanaTransaction } from "./use-case/SignSolanaTransaction";
import { attachSolanaSignature } from "./utils/signatureUtils";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet";

vi.mock("./utils/signatureUtils", () => ({
  attachSolanaSignature: vi.fn(() => new Uint8Array([9, 9, 9])),
}));

// System program id: a valid 32-byte base58 address.
const SOLANA_ADDRESS = "11111111111111111111111111111111";
// Another valid 32-byte base58 address (SPL Token program id).
const SOLANA_ADDRESS_2 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

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

const createMockSignUseCase = (): {
  execute: ReturnType<typeof vi.fn>;
} => ({
  execute: vi.fn(),
});

describe("LedgerSolanaWallet (connection)", () => {
  let host: ReturnType<typeof createMockHost>;
  let signSolanaMessage: ReturnType<typeof createMockSignUseCase>;
  let signUseCase: ReturnType<typeof createMockSignUseCase>;

  const createWallet = () =>
    new LedgerSolanaWallet(host as unknown as CoreFacade, {
      signSolanaMessage: signSolanaMessage as never,
      signSolanaTransaction: signUseCase as unknown as SignSolanaTransaction,
    });

  beforeEach(() => {
    host = createMockHost();
    signSolanaMessage = createMockSignUseCase();
    signUseCase = createMockSignUseCase();
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

  describe("setSelectedAccount", () => {
    it("emits a change event with the new account when switching Solana address after connect", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      wallet.setSelectedAccount(
        createAccount({ id: "solana:2", freshAddress: SOLANA_ADDRESS_2 }),
      );

      expect(listener).toHaveBeenCalledTimes(1);
      expect(wallet.accounts).toHaveLength(1);
      expect(wallet.accounts[0].address).toBe(SOLANA_ADDRESS_2);
      expect(listener).toHaveBeenCalledWith({ accounts: wallet.accounts });
    });

    it("does not emit a change event before the dApp has connected", () => {
      const wallet = createWallet();
      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);

      wallet.setSelectedAccount(createAccount());

      expect(listener).not.toHaveBeenCalled();
      expect(wallet.accounts).toEqual([]);
    });

    it("does not emit a change event when the selected address is unchanged", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      wallet.setSelectedAccount(createAccount());

      expect(listener).not.toHaveBeenCalled();
    });

    it("disconnects the Solana wallet when switching to a non-Solana account", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      wallet.setSelectedAccount(createAccount({ currencyId: "ethereum" }));

      expect(wallet.accounts).toEqual([]);
      expect(listener).toHaveBeenCalledWith({ accounts: [] });
      expect(host.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects the Solana wallet when the account is cleared", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      wallet.setSelectedAccount(undefined);

      expect(wallet.accounts).toEqual([]);
      expect(listener).toHaveBeenCalledWith({ accounts: [] });
      expect(host.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("clears the connected accounts, emits a change event, and notifies core", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      const listener = vi.fn();
      wallet.features["standard:events"].on("change", listener);
      await wallet.features["standard:disconnect"].disconnect();

      expect(wallet.accounts).toEqual([]);
      expect(listener).toHaveBeenCalledWith({ accounts: [] });
      expect(host.disconnect).toHaveBeenCalledWith("solana");
    });

    it("does not call host.disconnect a second time when already disconnected", async () => {
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());
      await wallet.features["standard:connect"].connect();

      await wallet.features["standard:disconnect"].disconnect();
      await wallet.features["standard:disconnect"].disconnect();

      expect(host.disconnect).toHaveBeenCalledTimes(1);
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
          params: { family: "solana", type: "message", broadcast: false },
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

  describe("signTransaction", () => {
    const transaction = new Uint8Array([1, 2, 3, 4]);
    const solanaSignature = new Uint8Array(64).fill(7);

    const successStatus: SignFlowStatus = {
      signType: "transaction",
      status: "success",
      data: { solanaSignature },
    };

    it("runs the use-case and returns the reassembled signed transaction", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      const [result] = await wallet.features[
        "solana:signTransaction"
      ].signTransaction({
        account: {} as never,
        transaction,
      });

      expect(signUseCase.execute).toHaveBeenCalledWith(
        {
          kind: "solana-transaction",
          address: SOLANA_ADDRESS,
          transaction,
        },
        expect.objectContaining({ freshAddress: SOLANA_ADDRESS }),
      );
      expect(attachSolanaSignature).toHaveBeenCalledWith(
        transaction,
        SOLANA_ADDRESS,
        solanaSignature,
      );
      expect(result.signedTransaction).toEqual(new Uint8Array([9, 9, 9]));
    });

    it("tracks each sign-flow status with neutral Solana metadata", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      await wallet.features["solana:signTransaction"].signTransaction({
        account: {} as never,
        transaction,
      });

      expect(host.trackBroadcastedTransaction).toHaveBeenCalledWith(
        successStatus,
        { family: "solana" },
      );
    });

    it("tracks an error status emitted by the use-case", async () => {
      const errorStatus: SignFlowStatus = {
        signType: "transaction",
        status: "error",
        error: new Error("sign failed"),
      };
      signUseCase.execute.mockReturnValue(of(errorStatus));
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      // The sign promise only settles on success or a modal close; an error
      // status just surfaces in the modal, so start the flow without awaiting
      // its (never-settling) resolution and let the sync emission be tracked.
      void wallet.features["solana:signTransaction"].signTransaction({
        account: {} as never,
        transaction,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(host.trackBroadcastedTransaction).toHaveBeenCalledWith(
        errorStatus,
        { family: "solana" },
      );
    });

    it("emits a signTransaction navigation intent", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      await wallet.features["solana:signTransaction"].signTransaction({
        account: {} as never,
        transaction,
      });

      expect(host.emitNavigationIntent).toHaveBeenCalledWith(
        expect.objectContaining({ name: "signTransaction" }),
      );
    });
  });

  describe("signAndSendTransaction", () => {
    const transaction = new Uint8Array([1, 2, 3, 4]);
    const solanaSignature = new Uint8Array(64).fill(7);
    // attachSolanaSignature is mocked to return this reassembled wire tx.
    const signedWireTx = new Uint8Array([9, 9, 9]);
    const signedWireTxBase64 = getBase64Decoder().decode(signedWireTx);
    const broadcastSignature = new Uint8Array(64).fill(3);
    const broadcastSignatureBase58 =
      getBase58Decoder().decode(broadcastSignature);

    const successStatus: SignFlowStatus = {
      signType: "transaction",
      status: "success",
      data: { solanaSignature },
    };

    const broadcastRequest = (options?: Record<string, unknown>) => ({
      jsonrpc: "2.0",
      id: 0,
      method: "sendTransaction",
      params: [signedWireTxBase64, { encoding: "base64", ...options }],
    });

    it("signs then broadcasts the wire transaction via core.broadcastRPC and returns the signature", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      host.broadcastRPC.mockResolvedValue({
        jsonrpc: "2.0",
        id: 0,
        result: broadcastSignatureBase58,
      });
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      const [result] = await wallet.features[
        "solana:signAndSendTransaction"
      ].signAndSendTransaction({
        account: {} as never,
        transaction,
      });

      expect(host.broadcastRPC).toHaveBeenCalledWith(broadcastRequest(), {
        name: "solana",
        chainId: "900",
      });
      expect(result.signature).toEqual(broadcastSignature);
    });

    it("forwards the send options to the sendTransaction envelope", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      host.broadcastRPC.mockResolvedValue({
        jsonrpc: "2.0",
        id: 0,
        result: broadcastSignatureBase58,
      });
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      const options = { skipPreflight: true, maxRetries: 2 };
      await wallet.features[
        "solana:signAndSendTransaction"
      ].signAndSendTransaction({
        account: {} as never,
        transaction,
        options,
      });

      expect(host.broadcastRPC).toHaveBeenCalledWith(
        broadcastRequest(options),
        { name: "solana", chainId: "900" },
      );
    });

    it("decodes a coin-service broadcast response", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      host.broadcastRPC.mockResolvedValue({
        transactionIdentifier: broadcastSignatureBase58,
      });
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      const [result] = await wallet.features[
        "solana:signAndSendTransaction"
      ].signAndSendTransaction({
        account: {} as never,
        transaction,
      });

      expect(result.signature).toEqual(broadcastSignature);
    });

    it("tracks a broadcasted success status carrying the base58 hash", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      host.broadcastRPC.mockResolvedValue({
        jsonrpc: "2.0",
        id: 0,
        result: broadcastSignatureBase58,
      });
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      await wallet.features[
        "solana:signAndSendTransaction"
      ].signAndSendTransaction({
        account: {} as never,
        transaction,
      });

      expect(host.trackBroadcastedTransaction).toHaveBeenCalledWith(
        {
          signType: "transaction",
          status: "success",
          data: {
            hash: broadcastSignatureBase58,
            signature: broadcastSignature,
          },
        },
        { family: "solana" },
      );
    });

    it("surfaces a broadcast failure as an error status without settling the promise", async () => {
      signUseCase.execute.mockReturnValue(of(successStatus));
      host.broadcastRPC.mockResolvedValue({
        jsonrpc: "2.0",
        id: 0,
        error: { code: -32002, message: "Transaction simulation failed" },
      });
      const wallet = createWallet();
      wallet.setSelectedAccount(createAccount());

      // The promise only settles on a mapped success or a modal close; a
      // broadcast failure just surfaces in the modal, so start the flow without
      // awaiting its (never-settling) resolution and let the error be tracked.
      let settled = false;
      void wallet.features["solana:signAndSendTransaction"]
        .signAndSendTransaction({
          account: {} as never,
          transaction,
        })
        .then(
          () => (settled = true),
          () => (settled = true),
        );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(settled).toBe(false);
      const [trackedStatus, trackedParams] =
        host.trackBroadcastedTransaction.mock.calls[0] ?? [];
      expect(trackedStatus).toMatchObject({
        signType: "transaction",
        status: "error",
      });
      expect((trackedStatus?.error as Error).message).toBe(
        "Solana broadcast failed: Transaction simulation failed",
      );
      expect(trackedParams).toEqual({ family: "solana" });
    });
  });
});

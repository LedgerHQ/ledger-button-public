import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { decode } from "ripple-binary-codec";
import { describe, expect, it, vi } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_ACCOUNT,
} from "./__mocks__/coreFacadeMock";
import { XrpApiError } from "./model/XrpApiError";
import type { SignXrpTransaction } from "./use-case/SignXrpTransaction";
import { runSignFlow } from "./utils/runSignFlow";
import {
  serializeForDevice,
  type XrpTransaction,
} from "./utils/xrpTransaction";
import { XrpWalletProvider } from "./XrpWalletProvider";

vi.mock("./utils/runSignFlow", () => ({ runSignFlow: vi.fn() }));

const PUBLIC_KEY =
  "03430ce12840c76b40f778c7900dc706cedaf6073947a1437179ef8bd402f871af";

const OTHER_ACCOUNT: ProviderAccount = {
  ...XRP_TEST_ACCOUNT,
  id: "xrp-account-1",
  freshAddress: "rQruxtzFbPR2JgBp47FEbh4pAyYDStcLJH",
  index: 1,
};

function createApi(requestedAccount: ProviderAccount = XRP_TEST_ACCOUNT) {
  const core = createMockCoreFacade({
    requestAccount: vi.fn().mockResolvedValue(requestedAccount),
  });
  const api = new XrpWalletProvider(core, {} as SignXrpTransaction);
  return { api, core };
}

describe("XrpWalletProvider", () => {
  describe("getAccount / fetchAccount", () => {
    it("returns null when no account is selected", async () => {
      const { api } = createApi();

      expect(await api.getAccount()).toBeNull();
      expect(await api.fetchAccount()).toBeNull();
    });

    it("returns the selected account without opening the modal", async () => {
      const { api, core } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);

      const expected = {
        address: XRP_TEST_ACCOUNT.freshAddress,
        network: "mainnet",
      };
      expect(await api.getAccount()).toEqual(expected);
      expect(await api.fetchAccount()).toEqual(expected);
      expect(core.requestAccount).not.toHaveBeenCalled();
    });

    it("ignores accounts of another currency", async () => {
      const { api } = createApi();
      api.setSelectedAccount({ ...XRP_TEST_ACCOUNT, currencyId: "ethereum" });

      expect(await api.getAccount()).toBeNull();
    });
  });

  describe("connect", () => {
    it("opens account selection when no account is selected", async () => {
      const { api, core } = createApi();

      const info = await api.connect();

      expect(core.requestAccount).toHaveBeenCalledWith("xrp");
      expect(info).toEqual({
        address: XRP_TEST_ACCOUNT.freshAddress,
        network: "mainnet",
      });
    });

    it("reuses the selected account without opening the modal", async () => {
      const { api, core } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);

      await api.connect();

      expect(core.requestAccount).not.toHaveBeenCalled();
    });

    it("silent connect returns the selected account without opening the modal", async () => {
      const { api, core } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);

      const info = await api.connect({ silent: true });

      expect(info.address).toBe(XRP_TEST_ACCOUNT.freshAddress);
      expect(core.requestAccount).not.toHaveBeenCalled();
    });

    it("silent connect rejects with NOT_CONNECTED when no account is selected", async () => {
      const { api, core } = createApi();

      const result = api.connect({ silent: true });

      await expect(result).rejects.toBeInstanceOf(XrpApiError);
      await expect(result).rejects.toMatchObject({ code: "NOT_CONNECTED" });
      expect(core.requestAccount).not.toHaveBeenCalled();
    });
  });

  describe("events", () => {
    it("emits connect with the account info", async () => {
      const { api } = createApi();
      const onConnect = vi.fn();
      api.on("connect", onConnect);

      await api.connect();

      expect(onConnect).toHaveBeenCalledWith({
        address: XRP_TEST_ACCOUNT.freshAddress,
        network: "mainnet",
      });
    });

    it("emits disconnect and clears the account", async () => {
      const { api, core } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      const onDisconnect = vi.fn();
      api.on("disconnect", onDisconnect);

      await api.disconnect();

      expect(core.disconnect).toHaveBeenCalledWith("xrp");
      expect(onDisconnect).toHaveBeenCalledTimes(1);
      expect(await api.getAccount()).toBeNull();
    });

    it("emits accountChanged when Core selects another account", () => {
      const { api } = createApi();
      const onChanged = vi.fn();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      api.on("accountChanged", onChanged);

      api.setSelectedAccount(OTHER_ACCOUNT);

      expect(onChanged).toHaveBeenCalledWith({
        address: OTHER_ACCOUNT.freshAddress,
        network: "mainnet",
      });
    });

    it("emits accountChanged with null when the account is cleared", () => {
      const { api } = createApi();
      const onChanged = vi.fn();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      api.on("accountChanged", onChanged);

      api.setSelectedAccount(undefined);

      expect(onChanged).toHaveBeenCalledWith(null);
    });

    it("does not emit accountChanged when the address is unchanged", () => {
      const { api } = createApi();
      const onChanged = vi.fn();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      api.on("accountChanged", onChanged);

      api.setSelectedAccount({ ...XRP_TEST_ACCOUNT });

      expect(onChanged).not.toHaveBeenCalled();
    });

    it("stops calling a listener after off()", () => {
      const { api } = createApi();
      const onChanged = vi.fn();
      api.on("accountChanged", onChanged);
      api.off("accountChanged", onChanged);

      api.setSelectedAccount(XRP_TEST_ACCOUNT);

      expect(onChanged).not.toHaveBeenCalled();
    });

    it("emits error when an operation rejects", async () => {
      const { api } = createApi();
      const onError = vi.fn();
      api.on("error", onError);

      await expect(api.connect({ silent: true })).rejects.toBeInstanceOf(
        XrpApiError,
      );

      expect(onError).toHaveBeenCalledWith(expect.any(XrpApiError));
    });

    it("keeps notifying other listeners when one throws", () => {
      const { api } = createApi();
      const second = vi.fn();
      api.on("accountChanged", () => {
        throw new Error("listener failure");
      });
      api.on("accountChanged", second);

      api.setSelectedAccount(XRP_TEST_ACCOUNT);

      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("sign", () => {
    it("assembles the blob from the transaction as it was when sign() was called", async () => {
      const { api } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      const callerTx: XrpTransaction = {
        TransactionType: "Payment",
        Destination: OTHER_ACCOUNT.freshAddress,
        Amount: "1000000",
        Fee: "10",
        Sequence: 1,
      };
      vi.mocked(runSignFlow).mockImplementation(async () => {
        callerTx.Amount = "999999999";
        return {
          xrpSignature: new Uint8Array([0x30, 0x45, 0x02, 0x21]),
          signingPubKey: PUBLIC_KEY,
        };
      });

      const { tx_blob } = await api.sign(callerTx);

      expect(decode(tx_blob)).toMatchObject({ Amount: "1000000" });
    });
  });

  describe("signAndSubmit", () => {
    const TX: XrpTransaction = {
      TransactionType: "Payment",
      Destination: OTHER_ACCOUNT.freshAddress,
      Amount: "1000000",
      Fee: "10",
      Sequence: 1,
    };

    function createSignedApi(submitResponse: unknown) {
      const { api, core } = createApi();
      api.setSelectedAccount(XRP_TEST_ACCOUNT);
      vi.mocked(runSignFlow).mockResolvedValue({
        xrpSignature: new Uint8Array([0x30, 0x45, 0x02, 0x21]),
        signingPubKey: PUBLIC_KEY,
      });
      vi.mocked(core.broadcastRPC).mockResolvedValue(submitResponse as never);
      return { api, core };
    }

    it("returns the hash when the node accepts the transaction", async () => {
      const { api } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "success", engine_result: "tesSUCCESS" },
      });

      const { hash } = await api.signAndSubmit(TX);

      expect(hash).toMatch(/^[0-9A-F]{64}$/);
    });

    it("registers the pending transaction and reports completion with the signed payload", async () => {
      const { api, core } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "success", engine_result: "tesSUCCESS" },
      });
      const signedPayload = serializeForDevice({
        ...TX,
        Account: XRP_TEST_ACCOUNT.freshAddress,
        SigningPubKey: PUBLIC_KEY,
      });

      const { hash } = await api.signAndSubmit(TX);

      expect(core.trackBroadcastedTransaction).toHaveBeenCalledWith(
        {
          signType: "transaction",
          status: "success",
          data: expect.objectContaining({
            hash,
            rawTransaction: signedPayload,
          }),
        },
        { family: "xrp", value: "1000000" },
      );
      expect(core.trackTransactionCompleted).toHaveBeenCalledWith({
        family: "xrp",
        transactionHash: hash,
        unsignedTransaction: signedPayload,
        recipientAddress: OTHER_ACCOUNT.freshAddress,
      });
    });

    it("still returns the hash when tracking throws", async () => {
      const { api, core } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "success", engine_result: "tesSUCCESS" },
      });
      vi.mocked(core.trackTransactionCompleted).mockImplementation(() => {
        throw new Error("tracking down");
      });

      await expect(api.signAndSubmit(TX)).resolves.toHaveProperty("hash");
    });

    it("returns the hash when the node queues the transaction", async () => {
      const { api } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        result: { status: "success", engine_result: "terQUEUED" },
      });

      await expect(api.signAndSubmit(TX)).resolves.toHaveProperty("hash");
    });

    it("rejects with SUBMIT_FAILED when the node rejects the transaction", async () => {
      const { api, core } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        result: {
          status: "success",
          engine_result: "tefPAST_SEQ",
          engine_result_message: "This sequence number has already passed.",
        },
      });
      const onError = vi.fn();
      api.on("error", onError);

      await expect(api.signAndSubmit(TX)).rejects.toMatchObject({
        code: "SUBMIT_FAILED",
        engineResult: "tefPAST_SEQ",
      });
      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(expect.any(XrpApiError));
      expect(core.trackTransactionCompleted).not.toHaveBeenCalled();
      expect(core.trackBroadcastedTransaction).not.toHaveBeenCalled();
    });

    it("rejects with SUBMIT_FAILED on a JSON-RPC error response", async () => {
      const { api } = createSignedApi({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32600, message: "Invalid Request" },
      });

      await expect(api.signAndSubmit(TX)).rejects.toMatchObject({
        code: "SUBMIT_FAILED",
      });
    });
  });
});

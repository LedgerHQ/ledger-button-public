import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it, vi } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_ACCOUNT,
} from "./__mocks__/coreFacadeMock";
import { XrpApiError } from "./model/XrpApiError";
import type { SignXrpTransaction } from "./use-case/SignXrpTransaction";
import { XrpWalletProvider } from "./XrpWalletProvider";

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
});

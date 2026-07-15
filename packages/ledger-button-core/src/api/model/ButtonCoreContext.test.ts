import { describe, expect, it } from "vitest";

import type { Account } from "../../internal/account/service/AccountService.js";
import type { BlockchainFamily } from "../blockchain-provider/model/types.js";
import {
  type ButtonCoreContext,
  getActiveFamily,
  getActiveSelectedAccount,
  getConnectedFamilies,
  getSelectedAccount,
} from "./ButtonCoreContext.js";

const ethereumAccount = {
  freshAddress: "0xabc",
  currencyId: "ethereum",
} as unknown as Account;

const solanaAccount = {
  freshAddress: "SoLaNa",
  currencyId: "solana",
} as unknown as Account;

function createContext(
  entries: [BlockchainFamily, Account][],
  activeFamily: BlockchainFamily | undefined,
): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: new Map<BlockchainFamily, Account>(entries),
    activeFamily,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: true,
    hasTrackingConsent: true,
    isMobilePlatform: false,
    preferredFiatCurrency: "usd",
  };
}

describe("ButtonCoreContext helpers", () => {
  describe("getConnectedFamilies", () => {
    it("returns all families with a selected account", () => {
      const context = createContext(
        [
          ["ethereum", ethereumAccount],
          ["solana", solanaAccount],
        ],
        "solana",
      );

      expect(getConnectedFamilies(context)).toEqual(["ethereum", "solana"]);
    });

    it("returns an empty array when nothing is connected", () => {
      expect(getConnectedFamilies(createContext([], undefined))).toEqual([]);
    });
  });

  describe("getActiveSelectedAccount", () => {
    it("returns the account for the active family", () => {
      const context = createContext(
        [
          ["ethereum", ethereumAccount],
          ["solana", solanaAccount],
        ],
        "solana",
      );

      expect(getActiveSelectedAccount(context)).toBe(solanaAccount);
    });

    it("falls back to the first connected family when activeFamily is unset", () => {
      const context = createContext([["solana", solanaAccount]], undefined);

      expect(getActiveSelectedAccount(context)).toBe(solanaAccount);
    });

    it("returns undefined when no account is selected", () => {
      expect(
        getActiveSelectedAccount(createContext([], undefined)),
      ).toBeUndefined();
    });
  });

  describe("getActiveFamily", () => {
    it("returns the active family", () => {
      const context = createContext([["solana", solanaAccount]], "solana");

      expect(getActiveFamily(context)).toBe("solana");
    });

    it("falls back to the first connected family when activeFamily is stale", () => {
      const context = createContext([["solana", solanaAccount]], "ethereum");

      expect(getActiveFamily(context)).toBe("solana");
    });

    it("returns undefined when nothing is connected", () => {
      expect(getActiveFamily(createContext([], undefined))).toBeUndefined();
    });
  });

  describe("getSelectedAccount", () => {
    it("defaults to the ethereum family", () => {
      const context = createContext(
        [["ethereum", ethereumAccount]],
        "ethereum",
      );

      expect(getSelectedAccount(context)).toBe(ethereumAccount);
    });
  });
});

import { describe, expect, it } from "vitest";

import type { ProviderRpcMethods } from "../../../blockchain-provider/model/BlockchainProvider.js";
import { resolveRpcRoute } from "./resolveRpcRoute.js";

describe("resolveRpcRoute", () => {
  describe("without dApp config", () => {
    it("routes statically-local methods to local", () => {
      expect(resolveRpcRoute("eth_accounts")).toBe("local");
      expect(resolveRpcRoute("eth_sendTransaction")).toBe("local");
    });

    it("routes statically-broadcasted methods to broadcasted", () => {
      expect(resolveRpcRoute("eth_call")).toBe("broadcasted");
      expect(resolveRpcRoute("eth_getBalance")).toBe("broadcasted");
    });

    it("routes unknown methods to unsupported", () => {
      expect(resolveRpcRoute("not_a_method")).toBe("unsupported");
    });
  });

  describe("with dApp config", () => {
    const config: ProviderRpcMethods = {
      local: ["custom_localMethod"],
      broadcasted: ["eth_transactionCount", "eth_sendTransaction"],
    };

    it("keeps the static baseline for methods the config omits", () => {
      expect(resolveRpcRoute("eth_accounts", config)).toBe("local");
      expect(resolveRpcRoute("eth_getBalance", config)).toBe("broadcasted");
    });

    it("adds methods the config marks as broadcasted", () => {
      expect(resolveRpcRoute("eth_transactionCount", config)).toBe(
        "broadcasted",
      );
    });

    it("adds methods the config marks as local", () => {
      expect(resolveRpcRoute("custom_localMethod", config)).toBe("local");
    });

    it("lets config.broadcasted override a default-local method", () => {
      expect(resolveRpcRoute("eth_sendTransaction")).toBe("local");
      expect(resolveRpcRoute("eth_sendTransaction", config)).toBe(
        "broadcasted",
      );
    });

    it("never narrows the baseline (config is additive)", () => {
      const sparse: ProviderRpcMethods = { local: [], broadcasted: [] };
      expect(resolveRpcRoute("eth_accounts", sparse)).toBe("local");
      expect(resolveRpcRoute("eth_call", sparse)).toBe("broadcasted");
    });
  });
});

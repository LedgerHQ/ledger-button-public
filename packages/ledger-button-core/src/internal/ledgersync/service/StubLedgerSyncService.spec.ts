import { lastValueFrom } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";

import type { InternalAuthContext } from "../model/InternalAuthContext.js";
import { StubLedgerSyncService } from "./StubLedgerSyncService.js";

describe("StubLedgerSyncService", () => {
  let service: StubLedgerSyncService;

  beforeEach(() => {
    service = new StubLedgerSyncService();
  });

  describe("authContext", () => {
    it("should always return undefined", () => {
      expect(service.authContext).toBeUndefined();
    });
  });

  describe("authenticate", () => {
    it("should return hardcoded values", async () => {
      const result$ = service.authenticate();
      const result = await lastValueFrom(result$);

      expect((result as InternalAuthContext).jwt).toBe("jwt");
      expect((result as InternalAuthContext).trustChainId).toBe("trustchainId");
      expect((result as InternalAuthContext).applicationPath).toBe(
        "applicationPath",
      );
      expect((result as InternalAuthContext).encryptionKey).toBeInstanceOf(
        Uint8Array,
      );
    });
  });

  describe("decrypt", () => {
    it("should return empty Uint8Array for any input", async () => {
      const encryptedData = new Uint8Array([1, 2, 3, 4, 5]);

      const result = await service.decrypt(encryptedData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });
  });
});

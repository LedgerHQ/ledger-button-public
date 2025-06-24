import "fake-indexeddb/auto";

import { Jwt } from "jsonwebtoken";
import { Maybe, Nothing, Right } from "purify-ts";

import { STORAGE_KEYS } from "./model/constant.js";
import { StorageIDBGetError } from "./model/errors.js";
import { DefaultStorageService } from "./DefaultStorageService.js";

let storageService: DefaultStorageService;
describe("DefaultStorageService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    storageService = new DefaultStorageService();
  });

  describe("LocalStorage methods", () => {
    describe("setLedgerButtonItem", () => {
      it("should be able to set an item", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem");
        storageService.setLedgerButtonItem("test", "test");
        expect(spy).toHaveBeenCalledWith(
          `${STORAGE_KEYS.PREFIX}-test`,
          JSON.stringify("test")
        );
      });

      it("should be able to set an item with an object and sanitize it", () => {
        const spy = vi.spyOn(JSON, "stringify");

        storageService.setLedgerButtonItem("test", { test: "test" });
        expect(spy).toHaveBeenCalledWith({ test: "test" });
      });
    });

    describe("getLedgerButtonItem", () => {
      it("should be able to get an item", () => {
        const spy = vi.spyOn(Storage.prototype, "getItem");
        storageService.setLedgerButtonItem("test", "test");
        const item = storageService.getLedgerButtonItem("test");
        expect(item).toStrictEqual(Maybe.of("test"));
        expect(spy).toHaveBeenCalledWith(`${STORAGE_KEYS.PREFIX}-test`);
      });

      it("should be able to get an item with a Nothing if the key does not exist", () => {
        vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        const item = storageService.getLedgerButtonItem("test");
        expect(item).toStrictEqual(Nothing);
      });
    });

    describe("removeLedgerButtonItem", () => {
      it("should be able to remove an item", () => {
        const spy = vi.spyOn(Storage.prototype, "removeItem");
        vi.spyOn(storageService, "hasLedgerButtonItem").mockReturnValue(true);
        storageService.removeLedgerButtonItem("test");
        expect(spy).toHaveBeenCalledWith(`${STORAGE_KEYS.PREFIX}-test`);
      });

      it("should not be able to remove an item if it does not exist", () => {
        const spy = vi.spyOn(Storage.prototype, "removeItem");
        vi.spyOn(storageService, "hasLedgerButtonItem").mockReturnValue(false);
        storageService.removeLedgerButtonItem("test");
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("hasLedgerButtonItem", () => {
      it("should be able to check if an item exists (false)", () => {
        const res = storageService.hasLedgerButtonItem("test");
        expect(res).toBe(false);
      });

      it("should be able to check if an item exists (true)", () => {
        storageService.setLedgerButtonItem("key", "value");
        const res = storageService.hasLedgerButtonItem("key");
        expect(res).toBe(true);
      });
    });

    describe("resetLedgerButtonStorage", () => {
      it("should be able to reset the storage", () => {
        storageService.setLedgerButtonItem("test", "test");
        storageService.resetLedgerButtonStorage();
        expect(localStorage.length).toBe(0);
      });

      it("should be able to reset the storage and keep other keys", () => {
        localStorage.setItem("yolo", "yolo");
        expect(localStorage.getItem("yolo")).toBe("yolo");
        storageService.setLedgerButtonItem("test", "test");
        storageService.resetLedgerButtonStorage();
        expect(localStorage.getItem("ledger-button-test")).toBeNull();
      });
    });

    it("should be able to format the key", () => {
      const formattedKey = DefaultStorageService.formatKey("test");
      expect(formattedKey).toBe("ledger-button-test");
    });
  });

  describe("IndexedDB (KeyPair) methods", () => {
    describe("initIdb", () => {
      it("should be able to initialize the IDB", async () => {
        const result = await storageService.initIdb();
        expect(result.isRight()).toBe(true);
        result.map((db) => {
          expect(db).toBeInstanceOf(IDBDatabase);
        });
      });
    });

    describe("storeKeyPair", () => {
      it("should be able to store a key pair", async () => {
        const keyPair = {
          publicKey: new Uint8Array([1, 2, 3]),
          privateKey: new Uint8Array([4, 5, 6]),
        };

        const result = await storageService.storeKeyPair(keyPair);
        expect(result).toStrictEqual(Right(true));
      });
    });

    describe("getKeyPair", () => {
      it("should be able to get a key pair", async () => {
        const keyPair = {
          publicKey: new Uint8Array([1, 2, 3]),
          privateKey: new Uint8Array([4, 5, 6]),
        };

        await storageService.storeKeyPair(keyPair);
        const result = await storageService.getKeyPair();
        expect(result).toStrictEqual(Right(keyPair));
      });
    });

    describe("getPublicKey", () => {
      it("should be able to get a public key", async () => {
        const keyPair = {
          publicKey: new Uint8Array([1, 2, 3]),
          privateKey: new Uint8Array([4, 5, 6]),
        };

        await storageService.storeKeyPair(keyPair);
        const result = await storageService.getPublicKey();
        expect(result).toStrictEqual(Right(keyPair.publicKey));
      });
    });

    describe("getPrivateKey", () => {
      it("should be able to get a private key", async () => {
        const keyPair = {
          publicKey: new Uint8Array([1, 2, 3]),
          privateKey: new Uint8Array([4, 5, 6]),
        };

        await storageService.storeKeyPair(keyPair);
        const result = await storageService.getPrivateKey();
        expect(result).toStrictEqual(Right(keyPair.privateKey));
      });
    });

    describe("removeKeyPair", () => {
      it("should be able to remove a key pair", async () => {
        await storageService.storeKeyPair({
          publicKey: new Uint8Array([1, 2, 3]),
          privateKey: new Uint8Array([4, 5, 6]),
        });

        const removed = await storageService.removeKeyPair();
        expect(removed).toStrictEqual(Right(true));
        const keyPair = await storageService.getKeyPair();
        expect(keyPair.isLeft()).toBe(true);
        keyPair.ifLeft((error) => {
          expect(error).toBeInstanceOf(StorageIDBGetError);
        });
      });
    });
  });

  describe("JWT methods", () => {
    let jwt: Jwt;

    beforeEach(() => {
      jwt = {
        header: { alg: "HS256" },
        payload: { sub: "test" },
        signature: "signature",
      };
    });

    describe("saveJWT", () => {
      it("should be able to save and get a JWT", () => {
        storageService.saveJWT(jwt);
        expect(storageService.getJWT()).toEqual(Maybe.of(jwt));
      });
      it("should remove a JWT", () => {
        storageService.saveJWT(jwt);
        storageService.removeJWT();
        expect(storageService.getJWT()).toBe(Nothing);
      });
    });
  });
});

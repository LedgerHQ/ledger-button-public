import { STORAGE_KEYS } from "./model/constant.js";
import { DefaultStorageService } from "./DefaultStorageService.js";

let storageService: DefaultStorageService;
describe("DefaultStorageService", () => {
  beforeEach(() => {
    localStorage.clear();
    storageService = new DefaultStorageService();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
        expect(item).toBe("test");
        expect(spy).toHaveBeenCalledWith(`${STORAGE_KEYS.PREFIX}-test`);
      });

      it("should be able to get an item with a null value if the key does not exist", () => {
        vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        const item = storageService.getLedgerButtonItem("test");
        expect(item).toBeNull();
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
      it("should be able to check if an item exists", () => {
        const spy = vi
          .spyOn(Storage.prototype, "getItem")
          .mockReturnValue("test");
        storageService.hasLedgerButtonItem("test");
        expect(spy).toHaveBeenCalled();
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
});

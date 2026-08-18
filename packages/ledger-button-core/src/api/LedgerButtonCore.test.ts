import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "./blockchain-provider/model/types";
import type { Account } from "./model/Account";
import { contextModuleTypes } from "../internal/context/di/contextModuleTypes";
import { deviceModuleTypes } from "../internal/device/di/deviceModuleTypes";
import { eventTrackingModuleTypes } from "../internal/event-tracking/di/eventTrackingModuleTypes";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/di/ledgerSyncModuleTypes";
import { loggerModuleTypes } from "../internal/logger/di/loggerModuleTypes";
import { modalModuleTypes } from "../internal/modal/di/modalModuleTypes";
import { navigationModuleTypes } from "../internal/navigation/di/navigationModuleTypes";
import { storageModuleTypes } from "../internal/storage/di/storageModuleTypes";
import { LedgerButtonCore } from "./LedgerButtonCore";

// Mock the DI container factory so the constructor wires our stubs instead of
// the real graph.
const hoisted = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: undefined as any,
}));
vi.mock("../internal/di", () => ({
  createContainer: () => hoisted.container,
}));

describe("LedgerButtonCore", () => {
  let trackOpened: { execute: ReturnType<typeof vi.fn> };
  let trackActivated: { execute: ReturnType<typeof vi.fn> };
  let selectedAccounts: Map<BlockchainFamily, Account>;
  let authResponse: unknown;
  let contextService: {
    getContext: ReturnType<typeof vi.fn>;
    onEvent: ReturnType<typeof vi.fn>;
  };
  let storage: {
    removeSelectedAccount: ReturnType<typeof vi.fn>;
    resetStorage: ReturnType<typeof vi.fn>;
  };

  const createCore = () => {
    trackOpened = { execute: vi.fn() };
    trackActivated = { execute: vi.fn().mockResolvedValue(undefined) };

    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    contextService = {
      getContext: vi.fn(() => ({ selectedAccounts })),
      onEvent: vi.fn(),
    };

    storage = {
      removeSelectedAccount: vi.fn(),
      resetStorage: vi.fn(),
    };

    const ledgerSyncService = {
      authenticate: vi.fn(() => of(authResponse)),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = new Map<symbol, any>([
      [loggerModuleTypes.LoggerPublisher, () => logger],
      [modalModuleTypes.ModalService, {}],
      [contextModuleTypes.ContextService, contextService],
      [navigationModuleTypes.NavigationIntentService, { observe: vi.fn() }],
      [ledgerSyncModuleTypes.LedgerSyncService, ledgerSyncService],
      [storageModuleTypes.StorageService, storage],
      [
        deviceModuleTypes.DeviceManagementKitService,
        { dmk: { close: vi.fn() } },
      ],
      [eventTrackingModuleTypes.TrackLedgerSyncOpened, trackOpened],
      [eventTrackingModuleTypes.TrackLedgerSyncActivated, trackActivated],
    ]);

    hoisted.container = {
      get: vi.fn((token: symbol) => registry.get(token)),
      unbindAll: vi.fn().mockResolvedValue(undefined),
      rebindSync: vi.fn(() => ({ toConstantValue: vi.fn() })),
    };

    // Skip the heavy async context bootstrap the real constructor kicks off.
    vi.spyOn(
      LedgerButtonCore.prototype as unknown as {
        initializeContext: () => void;
      },
      "initializeContext",
    ).mockResolvedValue(undefined as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new LedgerButtonCore({} as any);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    selectedAccounts = new Map();
    authResponse = { trustChainId: "tc-1", applicationPath: "m/0'" };
  });

  describe("connectToLedgerSync - event tracking", () => {
    it("tracks open + activated when no account is selected (onboarding)", () => {
      const core = createCore();

      core.connectToLedgerSync().subscribe();

      expect(trackOpened.execute).toHaveBeenCalledTimes(1);
      expect(trackActivated.execute).toHaveBeenCalledTimes(1);
    });

    it("skips both events when an account is already selected", () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
      ]);
      const core = createCore();

      core.connectToLedgerSync().subscribe();

      expect(trackOpened.execute).not.toHaveBeenCalled();
      expect(trackActivated.execute).not.toHaveBeenCalled();
    });

    it("skips both events when an account of any family is selected", () => {
      selectedAccounts = new Map([
        ["solana", { currencyId: "solana" } as Account],
      ]);
      const core = createCore();

      core.connectToLedgerSync().subscribe();

      expect(trackOpened.execute).not.toHaveBeenCalled();
      expect(trackActivated.execute).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("removes only the given family's account when others remain", async () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
        ["solana", { currencyId: "solana" } as Account],
      ]);
      const core = createCore();

      await core.disconnect("ethereum");

      expect(storage.removeSelectedAccount).toHaveBeenCalledWith("ethereum");
      expect(contextService.onEvent).toHaveBeenCalledWith({
        type: "account_disconnected",
        family: "ethereum",
      });
      // no full session reset while another family is still selected
      expect(storage.resetStorage).not.toHaveBeenCalled();
    });

    it("resets the session when the last selected account is removed", async () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
      ]);
      const core = createCore();

      await core.disconnect("ethereum");

      expect(storage.resetStorage).toHaveBeenCalledTimes(1);
      expect(storage.removeSelectedAccount).not.toHaveBeenCalled();
      expect(contextService.onEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "account_disconnected" }),
      );
    });

    it("resets the session when called with no family", async () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
        ["solana", { currencyId: "solana" } as Account],
      ]);
      const core = createCore();

      await core.disconnect();

      expect(storage.resetStorage).toHaveBeenCalledTimes(1);
      expect(storage.removeSelectedAccount).not.toHaveBeenCalled();
    });
  });

  describe("active family accessors", () => {
    it("exposes the connected families from the context", () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
        ["solana", { currencyId: "solana" } as Account],
      ]);
      const core = createCore();

      expect(core.getConnectedFamilies()).toEqual(["ethereum", "solana"]);
    });

    it("resolves the active family and its selected account", () => {
      const solanaAccount = { currencyId: "solana" } as Account;
      selectedAccounts = new Map([["solana", solanaAccount]]);
      const core = createCore();
      contextService.getContext.mockReturnValue({
        selectedAccounts,
        activeFamily: "solana",
      });

      expect(core.getActiveFamily()).toBe("solana");
      expect(core.getActiveSelectedAccount()).toBe(solanaAccount);
    });

    it("emits an active_family_changed event when switching families", () => {
      selectedAccounts = new Map([
        ["ethereum", { currencyId: "ethereum" } as Account],
        ["solana", { currencyId: "solana" } as Account],
      ]);
      const core = createCore();

      core.setActiveFamily("solana");

      expect(contextService.onEvent).toHaveBeenCalledWith({
        type: "active_family_changed",
        family: "solana",
      });
    });
  });
});

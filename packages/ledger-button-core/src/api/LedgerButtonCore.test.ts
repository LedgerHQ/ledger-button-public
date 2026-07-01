import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "./blockchain-provider/model/types.js";
import type { Account } from "../internal/account/service/AccountService.js";
import { contextModuleTypes } from "../internal/context/contextModuleTypes.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
import { eventTrackingModuleTypes } from "../internal/event-tracking/eventTrackingModuleTypes.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/ledgerSyncModuleTypes.js";
import { loggerModuleTypes } from "../internal/logger/loggerModuleTypes.js";
import { modalModuleTypes } from "../internal/modal/modalModuleTypes.js";
import { navigationModuleTypes } from "../internal/navigation/navigationModuleTypes.js";
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { LedgerButtonCore } from "./LedgerButtonCore.js";

// Mock the DI container factory so the constructor wires our stubs instead of
// the real graph.
const hoisted = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: undefined as any,
}));
vi.mock("../internal/di.js", () => ({
  createContainer: () => hoisted.container,
}));

describe("LedgerButtonCore", () => {
  let trackOpened: { execute: ReturnType<typeof vi.fn> };
  let trackActivated: { execute: ReturnType<typeof vi.fn> };
  let selectedAccounts: Map<BlockchainFamily, Account>;
  let authResponse: unknown;
  let contextService: { getContext: ReturnType<typeof vi.fn>; onEvent: ReturnType<typeof vi.fn> };
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
      [deviceModuleTypes.DeviceManagementKitService, { dmk: { close: vi.fn() } }],
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
      LedgerButtonCore.prototype as unknown as { initializeContext: () => void },
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
});

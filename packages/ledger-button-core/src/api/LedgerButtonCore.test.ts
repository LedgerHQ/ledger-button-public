import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { of, Subject } from "rxjs";
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
  createContainer: vi.fn(),
}));
vi.mock("../internal/di", () => ({
  createContainer: hoisted.createContainer,
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
  let restoreContext: ReturnType<typeof vi.spyOn>;
  let connectDevice: { execute: ReturnType<typeof vi.fn> };
  let disconnectDevice: { execute: ReturnType<typeof vi.fn> };
  let deviceSessionState$: Subject<{ deviceStatus: DeviceStatus }>;
  let deviceService: {
    connectedDevice?: { sessionId: string };
    sessionId?: string;
    dmk: {
      close: ReturnType<typeof vi.fn>;
      getDeviceSessionState: ReturnType<typeof vi.fn>;
    };
  };

  const createCore = () => {
    trackOpened = { execute: vi.fn() };
    trackActivated = { execute: vi.fn().mockResolvedValue(undefined) };
    connectDevice = {
      execute: vi.fn().mockResolvedValue({ sessionId: "new-session" }),
    };
    disconnectDevice = { execute: vi.fn().mockResolvedValue(undefined) };
    deviceSessionState$ = new Subject();
    deviceService = {
      dmk: {
        close: vi.fn(),
        getDeviceSessionState: vi.fn(() => deviceSessionState$),
      },
    };

    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    contextService = {
      getContext: vi.fn(() => ({
        selectedAccounts,
        connectedDevice: undefined,
      })),
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
      [deviceModuleTypes.DeviceManagementKitService, deviceService],
      [deviceModuleTypes.ConnectDeviceUseCase, connectDevice],
      [deviceModuleTypes.DisconnectDeviceUseCase, disconnectDevice],
      [eventTrackingModuleTypes.TrackLedgerSyncOpened, trackOpened],
      [eventTrackingModuleTypes.TrackLedgerSyncActivated, trackActivated],
    ]);

    hoisted.container = {
      get: vi.fn((token: symbol) => registry.get(token)),
    };
    hoisted.createContainer.mockReturnValue(hoisted.container);

    // Skip the heavy async context bootstrap the real constructor kicks off,
    // and the storage-backed rebuild that a reset triggers.
    vi.spyOn(
      LedgerButtonCore.prototype as unknown as {
        initializeContext: () => void;
      },
      "initializeContext",
    ).mockResolvedValue(undefined as never);
    restoreContext = vi
      .spyOn(
        LedgerButtonCore.prototype as unknown as {
          restoreContext: () => void;
        },
        "restoreContext",
      )
      .mockResolvedValue(undefined as never);

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

    it("keeps the same container so the provider held by the dApp stays live", async () => {
      const core = createCore();

      await core.disconnect();

      expect(hoisted.createContainer).toHaveBeenCalledTimes(1);
    });

    it("releases the device through disconnect rather than closing DMK", async () => {
      const core = createCore();

      await core.disconnect();

      expect(disconnectDevice.execute).toHaveBeenCalledTimes(1);
      // dmk.close() drops the session without emitting NOT_CONNECTED, leaving
      // our listeners convinced the device is still there.
      expect(deviceService.dmk.close).not.toHaveBeenCalled();
    });

    it("rebuilds the context once the session state is cleared", async () => {
      const core = createCore();

      await core.disconnect();

      expect(restoreContext).toHaveBeenCalledTimes(1);
      const [resetOrder] = storage.resetStorage.mock.invocationCallOrder;
      const [restoreOrder] = restoreContext.mock.invocationCallOrder;
      expect(resetOrder).toBeLessThan(restoreOrder as number);
    });

    it("still resets when the device cannot be released", async () => {
      const core = createCore();
      disconnectDevice.execute.mockRejectedValue(new Error("device is gone"));

      await core.disconnect();

      expect(storage.resetStorage).toHaveBeenCalledTimes(1);
      expect(restoreContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("device session lifecycle", () => {
    it("disconnects a stale DMK session before reconnecting", async () => {
      const core = createCore();
      deviceService.sessionId = "stale-session";

      await core.connectToDevice("usb");

      expect(disconnectDevice.execute).toHaveBeenCalledOnce();
      expect(connectDevice.execute).toHaveBeenCalledWith({ type: "usb" });
      expect(disconnectDevice.execute.mock.invocationCallOrder[0]).toBeLessThan(
        connectDevice.execute.mock.invocationCallOrder[0],
      );
    });

    it("cleans the DMK session when the device disconnects physically", async () => {
      const core = createCore();
      deviceService.connectedDevice = { sessionId: "session-1" };
      connectDevice.execute.mockImplementation(async () => {
        deviceService.connectedDevice = { sessionId: "session-1" };
        return { sessionId: "session-1" };
      });

      await core.connectToDevice("usb");
      disconnectDevice.execute.mockClear();
      deviceSessionState$.next({
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      await vi.waitFor(() => {
        expect(disconnectDevice.execute).toHaveBeenCalledOnce();
        expect(contextService.onEvent).toHaveBeenCalledWith({
          type: "device_disconnected",
        });
      });
    });

    it("waits for the disconnect cleanup before reconnecting", async () => {
      const core = createCore();
      deviceService.connectedDevice = { sessionId: "session-1" };
      connectDevice.execute.mockImplementation(async () => {
        deviceService.connectedDevice = { sessionId: "session-1" };
        return { sessionId: "session-1" };
      });
      await core.connectToDevice("usb");

      let resolveCleanup: () => void = () => undefined;
      disconnectDevice.execute.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveCleanup = resolve;
        }),
      );
      deviceService.connectedDevice = undefined;
      deviceSessionState$.next({ deviceStatus: DeviceStatus.NOT_CONNECTED });
      connectDevice.execute.mockClear();

      const pendingConnect = core.connectToDevice("usb");
      await Promise.resolve();
      expect(connectDevice.execute).not.toHaveBeenCalled();

      resolveCleanup();
      await pendingConnect;

      expect(connectDevice.execute).toHaveBeenCalledWith({ type: "usb" });
    });

    it("still connects when releasing the previous session fails", async () => {
      const core = createCore();
      deviceService.sessionId = "session-1";
      disconnectDevice.execute.mockRejectedValue(
        new Error("no matching device connection found"),
      );

      await core.connectToDevice("usb");

      expect(connectDevice.execute).toHaveBeenCalledWith({ type: "usb" });
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

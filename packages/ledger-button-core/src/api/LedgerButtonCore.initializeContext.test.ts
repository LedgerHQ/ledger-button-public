import { Maybe, Nothing } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { blockchainProviderModuleTypes } from "../internal/blockchain-provider/di/blockchainProviderModuleTypes";
import { contextModuleTypes } from "../internal/context/di/contextModuleTypes";
import { currencyModuleTypes } from "../internal/currency/di/currencyModuleTypes";
import { dAppConfigModuleTypes } from "../internal/dAppConfig/di/dAppConfigModuleTypes";
import { geoBlockModuleTypes } from "../internal/geo-block/di/geoBlockModuleTypes";
import { loggerModuleTypes } from "../internal/logger/di/loggerModuleTypes";
import { modalModuleTypes } from "../internal/modal/di/modalModuleTypes";
import { pendingTransactionModuleTypes } from "../internal/pending-transaction/di/pendingTransactionModuleTypes";
import { platformModuleTypes } from "../internal/platform/di/platformModuleTypes";
import { storageModuleTypes } from "../internal/storage/di/storageModuleTypes";
import { LedgerButtonCore } from "./LedgerButtonCore";

const hoisted = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: undefined as any,
  createContainer: vi.fn(),
}));
vi.mock("../internal/di/di", () => ({
  createContainer: hoisted.createContainer,
}));

describe("LedgerButtonCore initializeContext", () => {
  const dappConfig = { supportedBlockchains: [] };
  const factories = [{ family: "ethereum" }];

  let isGeoBlocked: boolean;
  let checkGeoBlock: { execute: ReturnType<typeof vi.fn> };
  let blockchainProviderManager: {
    init: ReturnType<typeof vi.fn>;
    describeCurrency: ReturnType<typeof vi.fn>;
    setSelectedAccounts: ReturnType<typeof vi.fn>;
  };
  let contextService: {
    getContext: ReturnType<typeof vi.fn>;
    onEvent: ReturnType<typeof vi.fn>;
  };

  const createCore = async ({ probePending = false } = {}) => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };
    checkGeoBlock = {
      execute: probePending
        ? vi.fn(() => new Promise<boolean>(() => undefined))
        : vi.fn().mockResolvedValue(isGeoBlocked),
    };
    blockchainProviderManager = {
      init: vi.fn(),
      describeCurrency: vi.fn(() => Maybe.empty()),
      setSelectedAccounts: vi.fn(),
    };
    contextService = {
      getContext: vi.fn(() => ({ isGeoBlocked })),
      onEvent: vi.fn(),
    };
    const storage = {
      getTrustChainId: vi.fn(() => Nothing),
      isTrustChainValid: vi.fn(() => false),
      getSelectedAccounts: vi.fn(() => new Map()),
      isWelcomeScreenCompleted: vi.fn().mockResolvedValue(false),
      getUserConsent: vi.fn().mockResolvedValue(Nothing),
      hasDeveloperMode: vi.fn(() => false),
      resetStorage: vi.fn(),
    };
    const coreFacade = { setDisconnectHandler: vi.fn() };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = new Map<symbol, any>([
      [loggerModuleTypes.LoggerPublisher, () => logger],
      [modalModuleTypes.ModalService, {}],
      [contextModuleTypes.ContextService, contextService],
      [dAppConfigModuleTypes.GetDAppConfigUseCase, {
        execute: vi.fn().mockResolvedValue(dappConfig),
      }],
      [storageModuleTypes.StorageService, storage],
      [storageModuleTypes.MigrateDbUseCase, {
        execute: vi.fn().mockResolvedValue(undefined),
      }],
      [blockchainProviderModuleTypes.CoreFacadeService, coreFacade],
      [
        blockchainProviderModuleTypes.BlockchainProviderManager,
        blockchainProviderManager,
      ],
      [geoBlockModuleTypes.CheckGeoBlockUseCase, checkGeoBlock],
      [platformModuleTypes.IsMobileUseCase, { execute: vi.fn(() => false) }],
      [
        currencyModuleTypes.CurrencyService,
        { initialize: vi.fn().mockResolvedValue("USD") },
      ],
      [pendingTransactionModuleTypes.PendingTransactionController, {}],
    ]);

    hoisted.container = {
      get: vi.fn((token: symbol) => registry.get(token)),
    };
    hoisted.createContainer.mockReturnValue(hoisted.container);

     
    const core = new LedgerButtonCore({
      blockchainProviderFactories: factories,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await vi.waitFor(() =>
      expect(blockchainProviderManager.setSelectedAccounts).toHaveBeenCalled(),
    );

    return core;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isGeoBlocked = false;
  });

  describe("when the user is not geo-blocked", () => {
    it("should check the geo-block status once", async () => {
      await createCore();

      expect(checkGeoBlock.execute).toHaveBeenCalledTimes(1);
    });

    it("should announce the blockchain providers", async () => {
      await createCore();

      expect(blockchainProviderManager.init).toHaveBeenCalledWith(
        expect.anything(),
        dappConfig,
        factories,
      );
    });

    it("should not wait for a probe that never answers", async () => {
      isGeoBlocked = false;
      const core = await createCore({ probePending: true });

      expect(core).toBeDefined();
      expect(blockchainProviderManager.init).toHaveBeenCalledTimes(1);
      expect(blockchainProviderManager.setSelectedAccounts).toHaveBeenCalled();
    });

    it("should restore the context as not geo-blocked", async () => {
      await createCore();

      expect(contextService.onEvent).toHaveBeenCalledWith({
        type: "initialize_context",
        context: expect.objectContaining({ isGeoBlocked: false }),
      });
    });
  });

  describe("when the user is geo-blocked", () => {
    beforeEach(() => {
      isGeoBlocked = true;
    });

    it("should still announce the blockchain providers", async () => {
      await createCore();

      expect(blockchainProviderManager.init).toHaveBeenCalledWith(
        expect.anything(),
        dappConfig,
        factories,
      );
    });

    it("should keep the geo-block flag when restoring the context", async () => {
      await createCore();

      expect(contextService.onEvent).toHaveBeenCalledWith({
        type: "initialize_context",
        context: expect.objectContaining({ isGeoBlocked: true }),
      });
    });
  });
});

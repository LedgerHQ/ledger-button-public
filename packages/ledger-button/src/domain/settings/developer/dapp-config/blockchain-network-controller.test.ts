import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Destination } from "../../../../shared/routes";
import { BlockchainNetworkController } from "./blockchain-network-controller";

const ETH_MAINNET: BlockchainNetwork = {
  id: "1",
  currencyId: "ethereum",
  currencyName: "Ethereum",
  currencyTicker: "ETH",
};

const ARBITRUM: BlockchainNetwork = {
  id: "42161",
  currencyId: "arbitrum",
  currencyName: "Arbitrum",
  currencyTicker: "ARB",
};

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createMockNavigation() {
  return { navigateTo: vi.fn(), navigateBack: vi.fn() };
}

function createMockDestinations() {
  return {
    addNetwork: {
      name: "addNetwork",
      component: "add-network-screen",
      canGoBack: true,
      toolbar: { title: "Add network", canClose: true },
    } as Destination,
  };
}

function createMockCore() {
  return {
    getBlockchainNetworks: vi.fn().mockReturnValue([]),
    hasNetworkOverrides: vi.fn().mockReturnValue(false),
    resetNetworkOverrides: vi.fn(),
  };
}

describe("BlockchainNetworkController", () => {
  let host: ReactiveControllerHost;
  let core: ReturnType<typeof createMockCore>;
  let navigation: ReturnType<typeof createMockNavigation>;
  let destinations: ReturnType<typeof createMockDestinations>;

  beforeEach(() => {
    host = createMockHost();
    core = createMockCore();
    navigation = createMockNavigation();
    destinations = createMockDestinations();
  });

  const createController = (
    blockchainId = "ethereum",
    displayName = "Ethereum",
  ) =>
    new BlockchainNetworkController(
      host,
      core as never,
      navigation as never,
      destinations as never,
      blockchainId,
      displayName,
    );

  it("should register itself with the host", () => {
    const controller = createController();
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("networks", () => {
    it("should read the networks from the core for its blockchain", () => {
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET, ARBITRUM]);

      expect(createController().networks).toEqual([ETH_MAINNET, ARBITRUM]);
      expect(core.getBlockchainNetworks).toHaveBeenCalledWith("ethereum");
    });

    it("should reflect networks added since construction without a reload", () => {
      const controller = createController();
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET]);

      expect(controller.networks).toEqual([ETH_MAINNET]);
    });
  });

  describe("hasOverrides", () => {
    it("should delegate to the core", () => {
      core.hasNetworkOverrides.mockReturnValue(true);

      expect(createController().hasOverrides).toBe(true);
      expect(core.hasNetworkOverrides).toHaveBeenCalledWith("ethereum");
    });
  });

  describe("resetOverrides", () => {
    it("should clear the overrides on the core and navigate back", () => {
      createController().resetOverrides();

      expect(core.resetNetworkOverrides).toHaveBeenCalledWith("ethereum");
      expect(navigation.navigateBack).toHaveBeenCalled();
    });
  });

  describe("navigateToAddNetwork", () => {
    it("should navigate to the addNetwork destination with blockchainId in screenData", () => {
      createController().navigateToAddNetwork();

      expect(navigation.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "addNetwork",
          screenData: { blockchainId: "ethereum", displayName: "Ethereum" },
        }),
      );
    });
  });
});

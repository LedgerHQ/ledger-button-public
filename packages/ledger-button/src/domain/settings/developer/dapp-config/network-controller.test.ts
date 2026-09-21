import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Destination } from "../../../../shared/routes";
import { NetworkController } from "./network-controller";

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
    getConfigOverrides: vi.fn().mockReturnValue([]),
    setConfigOverrides: vi.fn(),
    observeAccountGroups: vi.fn().mockReturnValue(of([])),
  };
}

describe("NetworkController", () => {
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

  const createController = () =>
    new NetworkController(
      host,
      core as never,
      navigation as never,
      destinations as never,
      vi.fn(),
    );

  it("should register itself with the host", () => {
    const controller = createController();
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("networks", () => {
    it("should merge base networks with stored overrides", () => {
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET]);
      core.getConfigOverrides.mockReturnValue([ARBITRUM]);

      expect(createController().networks).toEqual([ETH_MAINNET, ARBITRUM]);
      expect(core.getBlockchainNetworks).toHaveBeenCalledWith("ethereum");
    });

    it("should return only base networks when no overrides exist", () => {
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET, ARBITRUM]);

      expect(createController().networks).toEqual([ETH_MAINNET, ARBITRUM]);
    });

    it("should deduplicate when an override matches a base network", () => {
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET]);
      core.getConfigOverrides.mockReturnValue([ETH_MAINNET]);

      expect(createController().networks).toEqual([ETH_MAINNET]);
    });

    it("should reflect cleared overrides without a reload", () => {
      core.getBlockchainNetworks.mockReturnValue([ETH_MAINNET]);
      core.getConfigOverrides.mockReturnValue([ARBITRUM]);
      const controller = createController();

      expect(controller.networks).toEqual([ETH_MAINNET, ARBITRUM]);

      core.getConfigOverrides.mockReturnValue([]);
      expect(controller.networks).toEqual([ETH_MAINNET]);
    });
  });

  describe("hasOverrides", () => {
    it("should be true when stored overrides exist", () => {
      core.getConfigOverrides.mockReturnValue([ETH_MAINNET]);

      expect(createController().hasOverrides).toBe(true);
    });

    it("should be false when no overrides are stored", () => {
      expect(createController().hasOverrides).toBe(false);
    });
  });

  describe("resetOverrides", () => {
    it("should clear the overrides on the core and call invalidate", () => {
      const invalidate = vi.fn();
      new NetworkController(
        host,
        core as never,
        navigation as never,
        destinations as never,
        invalidate,
      ).resetOverrides();

      expect(core.setConfigOverrides).toHaveBeenCalledWith([]);
      expect(invalidate).toHaveBeenCalled();
    });

    it("should refresh the account list against the reset config", () => {
      createController().resetOverrides();

      expect(core.observeAccountGroups).toHaveBeenCalledWith({
        forceRefresh: true,
      });
    });
  });

  describe("navigateToAddNetwork", () => {
    it("should navigate to the addNetwork destination", () => {
      createController().navigateToAddNetwork();

      expect(navigation.navigateTo).toHaveBeenCalledWith(destinations.addNetwork);
    });
  });
});

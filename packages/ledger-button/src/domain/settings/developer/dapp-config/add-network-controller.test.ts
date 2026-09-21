import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddNetworkController } from "./add-network-controller";

const ETH_MAINNET: BlockchainNetwork = {
  id: "1",
  currencyId: "ethereum",
  currencyName: "Ethereum",
  currencyTicker: "ETH",
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

function createMockCore() {
  return {
    getConfigOverrides: vi.fn().mockReturnValue({ networkOverrides: [] }),
    setConfigOverrides: vi.fn(),
    getBlockchainNetworks: vi.fn().mockReturnValue([]),
  };
}

describe("AddNetworkController", () => {
  let host: ReactiveControllerHost;
  let core: ReturnType<typeof createMockCore>;
  let navigation: ReturnType<typeof createMockNavigation>;

  beforeEach(() => {
    host = createMockHost();
    core = createMockCore();
    navigation = createMockNavigation();
  });

  const createController = () =>
    new AddNetworkController(host, core as never, navigation as never);

  it("should register itself with the host", () => {
    const controller = createController();
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("addNetwork", () => {
    it("should append the new network to the stored overrides", () => {
      const existing = {
        id: "11155111",
        currencyId: "ethereum_sepolia",
        currencyName: "Sepolia",
        currencyTicker: "ETH",
      };
      core.getConfigOverrides.mockReturnValue({ networkOverrides: [existing] });

      createController().addNetwork(ETH_MAINNET);

      expect(core.setConfigOverrides).toHaveBeenCalledWith({
        networkOverrides: [existing, ETH_MAINNET],
      });
    });

    it("should navigate back after saving", () => {
      createController().addNetwork(ETH_MAINNET);

      expect(navigation.navigateBack).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("should navigate back without storing anything", () => {
      createController().cancel();

      expect(navigation.navigateBack).toHaveBeenCalled();
      expect(core.setConfigOverrides).not.toHaveBeenCalled();
    });
  });
});

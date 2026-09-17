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
    addNetworkOverride: vi.fn(),
    resetNetworkOverrides: vi.fn(),
    hasNetworkOverrides: vi.fn().mockReturnValue(false),
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

  const createController = (blockchainId = "ethereum") =>
    new AddNetworkController(
      host,
      core as never,
      navigation as never,
      blockchainId,
    );

  it("should register itself with the host", () => {
    const controller = createController();
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("addNetwork", () => {
    it("should store the new network as an override on the core", () => {
      createController().addNetwork(ETH_MAINNET);

      expect(core.addNetworkOverride).toHaveBeenCalledWith(
        "ethereum",
        ETH_MAINNET,
      );
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
      expect(core.addNetworkOverride).not.toHaveBeenCalled();
    });
  });
});

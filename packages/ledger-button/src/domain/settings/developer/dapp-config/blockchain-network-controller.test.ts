import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
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

const STORAGE_KEY = "ledger-button-configOverrides";

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

function createController(
  blockchainId = "ethereum",
  displayName = "Ethereum",
  baseNetworks: BlockchainNetwork[] = [],
  host?: ReactiveControllerHost,
) {
  return new BlockchainNetworkController(
    host ?? createMockHost(),
    createMockNavigation() as never,
    createMockDestinations() as never,
    blockchainId,
    displayName,
    baseNetworks,
  );
}

describe("BlockchainNetworkController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
    localStorage.clear();
  });

  it("should register itself with the host", () => {
    const controller = createController("ethereum", "Ethereum", [], host);
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("networks", () => {
    it("should return an empty array when no base networks are provided", () => {
      const controller = createController("ethereum");
      expect(controller.networks).toEqual([]);
    });

    it("should return the base networks passed at construction time", () => {
      const controller = createController("ethereum", "Ethereum", [
        ETH_MAINNET,
        ARBITRUM,
      ]);
      expect(controller.networks).toEqual([ETH_MAINNET, ARBITRUM]);
    });
  });

  describe("hasOverrides", () => {
    it("should return false when localStorage has no overrides", () => {
      const controller = createController("ethereum");
      expect(controller.hasOverrides).toBe(false);
    });

    it("should return true when localStorage has overrides for the blockchain", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ networkOverrides: { ethereum: [ETH_MAINNET] } }),
      );
      const controller = createController("ethereum");
      expect(controller.hasOverrides).toBe(true);
    });

    it("should return false when overrides exist only for a different blockchain", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ networkOverrides: { solana: [ETH_MAINNET] } }),
      );
      const controller = createController("ethereum");
      expect(controller.hasOverrides).toBe(false);
    });
  });

  describe("resetOverrides", () => {
    it("should clear overrides for the blockchain in localStorage and reload the page", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ networkOverrides: { ethereum: [ETH_MAINNET] } }),
      );
      const reloadMock = vi.fn();
      vi.stubGlobal("location", { reload: reloadMock });

      const controller = createController("ethereum", "Ethereum", [], host);

      controller.resetOverrides();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.networkOverrides.ethereum).toEqual([]);
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe("navigateToAddNetwork", () => {
    it("should navigate to the addNetwork destination with blockchainId in screenData", () => {
      const navigation = createMockNavigation();
      const destinations = createMockDestinations();
      const controller = new BlockchainNetworkController(
        host,
        navigation as never,
        destinations as never,
        "ethereum",
        "Ethereum",
        [],
      );

      controller.navigateToAddNetwork();

      expect(navigation.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "addNetwork",
          screenData: { blockchainId: "ethereum", displayName: "Ethereum" },
        }),
      );
    });
  });
});

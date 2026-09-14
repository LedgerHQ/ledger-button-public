import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import { AddNetworkController } from "./add-network-controller";

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

describe("AddNetworkController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
    localStorage.clear();
  });

  it("should register itself with the host", () => {
    const controller = new AddNetworkController(
      host,
      createMockNavigation() as never,
      "ethereum",
    );
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("addNetwork", () => {
    it("should write the new network to localStorage", () => {
      const controller = new AddNetworkController(
        host,
        createMockNavigation() as never,
        "ethereum",
      );

      controller.addNetwork(ETH_MAINNET);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.networkOverrides.ethereum).toEqual([ETH_MAINNET]);
    });

    it("should append to existing networks without overwriting other blockchains", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ networkOverrides: { ethereum: [ETH_MAINNET], solana: [] } }),
      );
      const controller = new AddNetworkController(
        host,
        createMockNavigation() as never,
        "ethereum",
      );

      controller.addNetwork(ARBITRUM);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.networkOverrides.ethereum).toEqual([ETH_MAINNET, ARBITRUM]);
      expect(stored.networkOverrides.solana).toEqual([]);
    });

    it("should navigate back after saving", () => {
      const navigation = createMockNavigation();
      const controller = new AddNetworkController(host, navigation as never, "ethereum");

      controller.addNetwork(ETH_MAINNET);

      expect(navigation.navigateBack).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("should navigate back without writing to localStorage", () => {
      const navigation = createMockNavigation();
      const controller = new AddNetworkController(host, navigation as never, "ethereum");

      controller.cancel();

      expect(navigation.navigateBack).toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});

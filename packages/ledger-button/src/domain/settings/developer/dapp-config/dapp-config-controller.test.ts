import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DappConfigController } from "./dapp-config-controller";

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createMockNavigation() {
  return {
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
  };
}

function createMockDestinations() {
  return {
    blockchainNetworks: {
      name: "blockchainNetworks",
      component: "blockchain-network-screen",
      canGoBack: true,
      toolbar: { title: "", canClose: true },
    },
  };
}

describe("DappConfigController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it("should register itself with the host", () => {
    const controller = new DappConfigController(
      host,
      createMockNavigation() as never,
      createMockDestinations() as never,
    );

    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  describe("blockchains", () => {
    it("should include built-in blockchains only", () => {
      const controller = new DappConfigController(
        host,
        createMockNavigation() as never,
        createMockDestinations() as never,
      );

      const ids = controller.blockchains.map((b) => b.id);
      expect(ids).toEqual(["ethereum", "solana"]);
    });
  });
});

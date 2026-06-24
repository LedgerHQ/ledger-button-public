/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { EIP1193Provider } from "../../api/model/eip/EIPTypes.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";

const createMockEip1193Provider = (): EIP1193Provider =>
  ({}) as EIP1193Provider;

describe("EvmWalletProvider", () => {
  let provider: EIP1193Provider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = createMockEip1193Provider();
  });

  test('family is "evm"', () => {
    expect(new EvmWalletProvider(provider).family).toBe("evm");
  });

  describe("init()", () => {
    let announced: CustomEvent[];

    beforeEach(() => {
      announced = [];
      const onAnnounce = (event: Event) => announced.push(event as CustomEvent);
      window.addEventListener("eip6963:announceProvider", onAnnounce);
      return () =>
        window.removeEventListener("eip6963:announceProvider", onAnnounce);
    });

    test("announces an EIP-6963 provider immediately", () => {
      const teardown = new EvmWalletProvider(provider).init();

      expect(announced).toHaveLength(1);
      expect(announced[0]?.detail.info).toMatchObject({
        name: "Ledger Wallet",
        rdns: "com.ledger.wallet.provider",
      });

      teardown();
    });

    test("provider info includes a non-empty UUID string", () => {
      const teardown = new EvmWalletProvider(provider).init();

      expect(announced[0]?.detail.info.uuid).toBeTypeOf("string");
      expect(announced[0]?.detail.info.uuid).not.toBe("");

      teardown();
    });

    test("provider detail is frozen", () => {
      const teardown = new EvmWalletProvider(provider).init();

      expect(Object.isFrozen(announced[0]?.detail)).toBe(true);

      teardown();
    });

    test("announced provider is the EIP-1193 provider passed to the constructor", () => {
      const teardown = new EvmWalletProvider(provider).init();

      expect(announced[0]?.detail.provider).toBe(provider);

      teardown();
    });

    test("re-announces when a dApp requests providers", () => {
      const teardown = new EvmWalletProvider(provider).init();
      announced.length = 0;

      window.dispatchEvent(new Event("eip6963:requestProvider"));

      expect(announced).toHaveLength(1);

      teardown();
    });

    test("stops re-announcing after teardown", () => {
      const teardown = new EvmWalletProvider(provider).init();
      teardown();
      announced.length = 0;

      window.dispatchEvent(new Event("eip6963:requestProvider"));

      expect(announced).toHaveLength(0);
    });

    test("icon is a dark SVG data URI when prefers-color-scheme is dark", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
      } as MediaQueryList);

      const teardown = new EvmWalletProvider(provider).init();
      const icon = announced[0]?.detail.info.icon as string;

      expect(icon).toMatch(/^data:image\/svg\+xml;base64,/);
      // White glyph SVG contains fill:#FFFFFF; black glyph contains fill:#000000
      expect(atob(icon.replace("data:image/svg+xml;base64,", ""))).toContain(
        "fill:#FFFFFF",
      );

      teardown();
    });

    test("icon is a light SVG data URI when prefers-color-scheme is not dark", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: false,
      } as MediaQueryList);

      const teardown = new EvmWalletProvider(provider).init();
      const icon = announced[0]?.detail.info.icon as string;

      expect(icon).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(atob(icon.replace("data:image/svg+xml;base64,", ""))).toContain(
        "fill:#000000",
      );

      teardown();
    });
  });
});

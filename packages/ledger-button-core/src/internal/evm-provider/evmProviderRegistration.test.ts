/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

import type { ProviderRegistrationContext } from "../provider-registration/ChainProviderRegistration.js";
import { evmProviderRegistration } from "./evmProviderRegistration.js";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";

vi.mock("./LedgerEIP1193Provider.js", () => ({
  LedgerEIP1193Provider: vi.fn(),
}));

const context = {
  core: {} as ProviderRegistrationContext["core"],
  app: {} as ProviderRegistrationContext["app"],
};

describe("evmProviderRegistration", () => {
  let announced: CustomEvent[];
  const onAnnounce = (event: Event) => announced.push(event as CustomEvent);

  beforeEach(() => {
    announced = [];
    vi.mocked(LedgerEIP1193Provider).mockClear();
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
  });

  test("announces an EIP-6963 provider immediately on register", () => {
    const unregister = evmProviderRegistration.register(context);

    expect(LedgerEIP1193Provider).toHaveBeenCalledWith(context.core, context.app);
    expect(announced).toHaveLength(1);
    expect(announced[0]?.detail.info).toMatchObject({
      name: "Ledger Wallet",
      rdns: "com.ledger.wallet.provider",
    });

    unregister();
  });

  test("re-announces when a dApp requests providers", () => {
    const unregister = evmProviderRegistration.register(context);
    announced.length = 0;

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    expect(announced).toHaveLength(1);

    unregister();
  });

  test("stops responding to provider requests after unregister", () => {
    const unregister = evmProviderRegistration.register(context);
    unregister();
    announced.length = 0;

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    expect(announced).toHaveLength(0);
  });
});

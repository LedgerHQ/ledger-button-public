import { afterEach, describe, expect, it, vi } from "vitest";

import type { LedgerXrpApi } from "../LedgerXrpApi";
import { registerXrpProvider } from "./registerXrpProvider";

const createApi = () =>
  ({
    family: "xrp",
    connect: vi.fn(async () => ({ address: "rAddress" })),
    disconnect: vi.fn(async () => undefined),
    getAccount: vi.fn(async () => null),
    fetchAccount: vi.fn(async () => null),
    sign: vi.fn(),
    signAndSubmit: vi.fn(async () => ({ hash: "HASH" })),
    on: vi.fn(),
    off: vi.fn(),
    setSelectedAccount: vi.fn(),
  }) as unknown as LedgerXrpApi;

const announceOnRequest = () => {
  let announced: { provider: LedgerXrpApi } | undefined;
  const listener = (event: Event) => {
    announced = (event as CustomEvent<{ provider: LedgerXrpApi }>).detail;
  };
  window.addEventListener("ledger-xrpl:announceProvider", listener);
  return {
    get: () => announced,
    stop: () =>
      window.removeEventListener("ledger-xrpl:announceProvider", listener),
  };
};

describe("registerXrpProvider", () => {
  let unregister: (() => void) | undefined;

  afterEach(() => {
    unregister?.();
    unregister = undefined;
  });

  it("announces a facade, not the implementation instance", () => {
    const api = createApi();
    const listener = announceOnRequest();

    unregister = registerXrpProvider(api);

    expect(listener.get()?.provider).not.toBe(api);
    listener.stop();
  });

  it("does not expose members outside the public surface", () => {
    const listener = announceOnRequest();

    unregister = registerXrpProvider(createApi());

    const provider = listener.get()?.provider as unknown as Record<
      string,
      unknown
    >;
    expect(Object.keys(provider).sort()).toEqual([
      "connect",
      "disconnect",
      "family",
      "fetchAccount",
      "getAccount",
      "off",
      "on",
      "sign",
      "signAndSubmit",
    ]);
    expect(provider.setSelectedAccount).toBeUndefined();
    listener.stop();
  });

  it("freezes the announced object", () => {
    const listener = announceOnRequest();

    unregister = registerXrpProvider(createApi());

    expect(Object.isFrozen(listener.get()?.provider)).toBe(true);
    listener.stop();
  });

  it("delegates calls to the implementation", async () => {
    const api = createApi();
    const listener = announceOnRequest();

    unregister = registerXrpProvider(api);

    await expect(listener.get()?.provider.signAndSubmit({})).resolves.toEqual({
      hash: "HASH",
    });
    expect(api.signAndSubmit).toHaveBeenCalledWith({});
    listener.stop();
  });

  it("passes listeners through unchanged so off() can remove them", () => {
    const api = createApi();
    const listener = announceOnRequest();
    const callback = vi.fn();

    unregister = registerXrpProvider(api);
    listener.get()?.provider.on("accountChanged", callback);
    listener.get()?.provider.off("accountChanged", callback);

    expect(api.on).toHaveBeenCalledWith("accountChanged", callback);
    expect(api.off).toHaveBeenCalledWith("accountChanged", callback);
    listener.stop();
  });

  it("re-announces the same facade when a dApp requests the provider", () => {
    const announced: unknown[] = [];
    const listener = (event: Event) => {
      announced.push(
        (event as CustomEvent<{ provider: unknown }>).detail.provider,
      );
    };
    window.addEventListener("ledger-xrpl:announceProvider", listener);
    unregister = registerXrpProvider(createApi());

    window.dispatchEvent(new Event("ledger-xrpl:requestProvider"));

    expect(announced).toHaveLength(2);
    expect(announced[1]).toBe(announced[0]);
    window.removeEventListener("ledger-xrpl:announceProvider", listener);
  });
});

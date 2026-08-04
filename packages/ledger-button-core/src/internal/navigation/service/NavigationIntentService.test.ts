import { EMPTY, type Observable } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { WalletNavigationIntent } from "../../../api/blockchain-provider/model/types.js";
import { NavigationIntentService } from "./NavigationIntentService.js";

const createSelectAccountIntent = (): WalletNavigationIntent => ({
  name: "selectAccount",
  params: { family: "ethereum" },
  status$: EMPTY as Observable<never>,
  finish: vi.fn(),
  retry: vi.fn(),
});

const createSignIntent = (): WalletNavigationIntent => ({
  name: "signTransaction",
  params: { family: "ethereum", type: "transaction", broadcast: true },
  status$: EMPTY as Observable<never>,
  finish: vi.fn(),
  retry: vi.fn(),
});

describe("NavigationIntentService", () => {
  it("delivers emitted intents to subscribers", () => {
    const service = new NavigationIntentService();
    const received: WalletNavigationIntent[] = [];
    service.observe().subscribe((intent) => received.push(intent));

    const intent = createSelectAccountIntent();
    service.emit(intent);

    expect(received).toEqual([intent]);
  });

  it("does not replay intents emitted before subscription", () => {
    const service = new NavigationIntentService();
    service.emit(createSignIntent());

    const received: WalletNavigationIntent[] = [];
    service.observe().subscribe((intent) => received.push(intent));

    expect(received).toEqual([]);
  });

  it("broadcasts to multiple subscribers", () => {
    const service = new NavigationIntentService();
    const a = vi.fn();
    const b = vi.fn();
    service.observe().subscribe(a);
    service.observe().subscribe(b);

    const intent = createSelectAccountIntent();
    service.emit(intent);

    expect(a).toHaveBeenCalledWith(intent);
    expect(b).toHaveBeenCalledWith(intent);
  });
});

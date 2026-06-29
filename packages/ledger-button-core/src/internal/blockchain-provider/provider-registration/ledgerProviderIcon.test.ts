/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, test, vi } from "vitest";

import { getLedgerProviderIcon } from "./ledgerProviderIcon.js";

const decodeIconSvg = (dataUri: string): string => {
  const base64 = dataUri.split(",")[1];
  return atob(base64 ?? "");
};

describe("getLedgerProviderIcon", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns the white icon when dark color scheme is preferred", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme:dark)",
    } as MediaQueryList);

    expect(decodeIconSvg(getLedgerProviderIcon())).toContain("fill:#FFFFFF");
  });

  test("returns the black icon when light color scheme is preferred", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-color-scheme:dark)",
    } as MediaQueryList);

    expect(decodeIconSvg(getLedgerProviderIcon())).toContain("fill:#000000");
  });
});

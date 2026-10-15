import { describe, expect, it } from "vitest";

import { resolveRcVersions } from "./rc-versions.cjs";

const stableSet = [
  { name: "@ledgerhq/ledger-wallet-provider", version: "2.0.0", path: "a" },
  { name: "@ledgerhq/ledger-wallet-provider-evm", version: "1.3.4", path: "b" },
];

describe("resolveRcVersions", () => {
  it("turns a stable set into rc.0 while keeping each own X.Y.Z", () => {
    const resolved = resolveRcVersions(stableSet, 0);

    expect(resolved.map(({ name, to }) => [name, to])).toEqual([
      ["@ledgerhq/ledger-wallet-provider", "2.0.0-rc.0"],
      ["@ledgerhq/ledger-wallet-provider-evm", "1.3.4-rc.0"],
    ]);
  });

  it("reports the version it read so callers can log the transition", () => {
    const [provider] = resolveRcVersions(stableSet, 3);

    expect(provider).toMatchObject({
      path: "a",
      from: "2.0.0",
      to: "2.0.0-rc.3",
    });
  });

  it("replaces the number of an already-published candidate", () => {
    const resolved = resolveRcVersions(
      [{ name: "provider", version: "2.0.0-rc.4", path: "a" }],
      5,
    );

    expect(resolved[0].to).toBe("2.0.0-rc.5");
  });

  it("accepts the number as a string, as GitHub Actions passes it", () => {
    const resolved = resolveRcVersions(stableSet, "2");

    expect(resolved[0].to).toBe("2.0.0-rc.2");
  });

  it.each([undefined, "", "rc.1", "1.5", -1, "0x1"])(
    "rejects %o as a release candidate number",
    (number) => {
      expect(() => resolveRcVersions(stableSet, number)).toThrow(
        /Invalid release candidate number/,
      );
    },
  );

  it("rejects a mixed release candidate and stable set", () => {
    const mixed = [
      { name: "provider", version: "2.0.0-rc.0", path: "a" },
      { name: "provider-evm", version: "1.3.4", path: "b" },
    ];

    expect(() => resolveRcVersions(mixed, 1)).toThrow(
      /Mixed release candidate and stable versions/,
    );
  });

  it("rejects a prerelease identifier other than rc", () => {
    const beta = [{ name: "provider", version: "2.0.0-beta.1", path: "a" }];

    expect(() => resolveRcVersions(beta, 1)).toThrow(
      /must be X\.Y\.Z or X\.Y\.Z-rc\.N/,
    );
  });

  it("rejects a snapshot version", () => {
    const snapshot = [
      { name: "provider", version: "0.0.0-develop-20260916100000", path: "a" },
    ];

    expect(() => resolveRcVersions(snapshot, 1)).toThrow(
      /must be X\.Y\.Z or X\.Y\.Z-rc\.N/,
    );
  });

  it("rejects a version that is not semver", () => {
    const invalid = [{ name: "provider", version: "2.0", path: "a" }];

    expect(() => resolveRcVersions(invalid, 1)).toThrow(
      /is not a valid semver version/,
    );
  });
});

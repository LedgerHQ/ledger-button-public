import { describe, expect, it } from "vitest";

import { partitionReleaseArgs } from "./run-release.cjs";

describe("release argument forwarding", () => {
  it("sends dry-run, projects, and groups to version and changelog", () => {
    const partitioned = partitionReleaseArgs([
      "--dry-run",
      "--projects=@ledgerhq/ledger-wallet-provider-solana",
      "--groups",
      "libraries",
    ]);

    expect(partitioned.versionArgs).toEqual([
      "--dry-run",
      "--projects=@ledgerhq/ledger-wallet-provider-solana",
      "--groups",
      "libraries",
    ]);
    expect(partitioned.changelogArgs).toEqual(partitioned.versionArgs);
  });

  it("keeps a version specifier off the changelog command", () => {
    const partitioned = partitionReleaseArgs(["patch", "--preid", "rc", "-d"]);

    expect(partitioned.versionArgs).toEqual(["patch", "--preid", "rc", "-d"]);
    expect(partitioned.changelogArgs).toEqual(["-d"]);
  });

  it("drops the extra separator pnpm inserts before script arguments", () => {
    const partitioned = partitionReleaseArgs(["--", "--verbose"]);

    expect(partitioned.versionArgs).toEqual(["--verbose"]);
    expect(partitioned.changelogArgs).toEqual(["--verbose"]);
  });

  it("rejects a project filter with no value", () => {
    expect(() => partitionReleaseArgs(["--projects"])).toThrow(
      "Missing value for --projects",
    );
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  filterReleaseProjects,
  loadReleaseProjects,
  parseProjectSelector,
  releaseProjectsFromConfig,
} from "./release-projects.cjs";

const manifests = [
  {
    name: "@ledgerhq/ledger-wallet-provider",
    version: "2.0.1",
    path: "packages/ledger-button/package.json",
    directory: "ledger-button",
  },
  {
    name: "@ledgerhq/ledger-wallet-provider-core",
    version: "2.0.1",
    path: "packages/ledger-button-core/package.json",
    directory: "ledger-button-core",
  },
  {
    name: "@ledgerhq/ledger-wallet-provider-solana",
    version: "1.0.1",
    path: "packages/ledger-wallet-provider-solana/package.json",
    directory: "ledger-wallet-provider-solana",
  },
];

const nxJson = {
  release: {
    groups: {
      libraries: {
        projects: [
          "@ledgerhq/ledger-wallet-provider",
          "@ledgerhq/ledger-wallet-provider-core",
        ],
      },
      providers: {
        projects: ["@ledgerhq/ledger-wallet-provider-solana"],
      },
    },
  },
};

describe("release projects", () => {
  it("lists release group members in group order", () => {
    const projects = releaseProjectsFromConfig(nxJson, manifests);

    expect(projects.map((project) => project.name)).toEqual([
      "@ledgerhq/ledger-wallet-provider",
      "@ledgerhq/ledger-wallet-provider-core",
      "@ledgerhq/ledger-wallet-provider-solana",
    ]);
  });

  it("refuses a release group member that has no package", () => {
    expect(() =>
      releaseProjectsFromConfig(nxJson, manifests.slice(0, 2)),
    ).toThrow("has no package");
  });

  it("keeps an empty selector as every release project", () => {
    const projects = releaseProjectsFromConfig(nxJson, manifests);

    expect(filterReleaseProjects(projects, parseProjectSelector(""))).toEqual(
      projects,
    );
    expect(
      filterReleaseProjects(projects, parseProjectSelector(undefined)),
    ).toEqual(projects);
  });

  it("matches a package name, its unscoped name, or its directory", () => {
    const projects = releaseProjectsFromConfig(nxJson, manifests);
    const selected = filterReleaseProjects(projects, [
      "@ledgerhq/ledger-wallet-provider-solana",
      "ledger-button",
    ]);

    expect(selected.map((project) => project.directory)).toEqual([
      "ledger-wallet-provider-solana",
      "ledger-button",
    ]);
  });

  it("does not let the UI short name select another provider", () => {
    const projects = releaseProjectsFromConfig(nxJson, manifests);
    const selected = filterReleaseProjects(projects, [
      "ledger-wallet-provider",
    ]);

    expect(selected.map((project) => project.name)).toEqual([
      "@ledgerhq/ledger-wallet-provider",
    ]);
  });

  it("rejects a project that is not in a release group", () => {
    const projects = releaseProjectsFromConfig(nxJson, manifests);

    expect(() =>
      filterReleaseProjects(projects, [
        "@ledgerhq/ledger-wallet-provider-bitcoin",
      ]),
    ).toThrow("Unknown release project");
  });

  it("reads every release group member from this workspace", () => {
    const workspaceRoot = join(import.meta.dirname, "../..");
    const nxJson = JSON.parse(
      readFileSync(join(workspaceRoot, "nx.json"), "utf8"),
    );
    const expected = [];

    for (const group of Object.values(nxJson.release.groups)) {
      for (const name of group.projects) {
        if (!expected.includes(name)) {
          expected.push(name);
        }
      }
    }

    const projects = loadReleaseProjects(workspaceRoot);

    expect(projects.map((project) => project.name)).toEqual(expected);
    expect(projects.every((project) => project.version && project.path)).toBe(
      true,
    );
  });
});

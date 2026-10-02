import { describe, expect, it } from "vitest";

import type {
  BlockchainAppDependency,
  BlockchainConfig,
} from "../../model/dappConfig/BlockchainConfig";
import { createOpenAppConfig } from "./createOpenAppConfig";

const DEPENDENCY_NAME = "Dep";

const createConfig = (
  appName: string,
  dependencies: BlockchainAppDependency[],
): BlockchainConfig => ({
  blockchain: "ethereum",
  appName,
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName, dependencies },
});

const createConfigWithDependency = (minVersion?: string): BlockchainConfig =>
  createConfig("Ethereum", [{ name: DEPENDENCY_NAME, minVersion }]);

describe("createOpenAppConfig", () => {
  describe("minVersion mapping", () => {
    it.each([
      { minVersion: ">=1.16.0", expected: "1.16.0" },
      { minVersion: ">=1.0.0", expected: "1.0.0" },
      { minVersion: ">1.0.0", expected: "1.0.0" },
      { minVersion: "^2.1.0", expected: "2.1.0" },
      { minVersion: "~2.1.0", expected: "2.1.0" },
      { minVersion: " >=1.0.0 ", expected: "1.0.0" },
      { minVersion: "1.0.0", expected: "1.0.0" },
      { minVersion: "1.0.0-beta", expected: "1.0.0-beta" },
      { minVersion: "1.2.3+build.1", expected: "1.2.3+build.1" },
      { minVersion: "latest", expected: "latest" },
    ])(
      "constrains a dependency with $minVersion to $expected",
      ({ minVersion, expected }) => {
        const [dependency] = createOpenAppConfig(
          createConfigWithDependency(minVersion),
        ).dependencies;

        expect(dependency).toEqual({
          name: DEPENDENCY_NAME,
          constraints: [{ minVersion: expected }],
        });
      },
    );

    it.each([
      { scenario: "no minVersion", minVersion: undefined },
      { scenario: "an empty string", minVersion: "" },
      { scenario: "a blank string", minVersion: "   " },
      { scenario: "a non-version string", minVersion: "not-a-version" },
      { scenario: "an incomplete semver", minVersion: "1.0" },
    ])(
      "leaves the dependency unconstrained for $scenario",
      ({ minVersion }) => {
        const [dependency] = createOpenAppConfig(
          createConfigWithDependency(minVersion),
        ).dependencies;

        expect(dependency).toEqual({ name: DEPENDENCY_NAME });
      },
    );
  });

  describe("application", () => {
    it("reuses the constraints of the dependency sharing its name", () => {
      const config = createConfig("1inch", [
        { name: "1inch", minVersion: ">=1.0.0" },
        { name: "Ethereum" },
      ]);

      expect(createOpenAppConfig(config)).toEqual({
        application: { name: "1inch", constraints: [{ minVersion: "1.0.0" }] },
        dependencies: [
          { name: "1inch", constraints: [{ minVersion: "1.0.0" }] },
          { name: "Ethereum" },
        ],
        requireLatestFirmware: false,
      });
    });

    it("stays unconstrained when no dependency shares its name", () => {
      const config = createConfig("Ethereum", [
        { name: "1inch", minVersion: ">=1.0.0" },
      ]);

      expect(createOpenAppConfig(config).application).toEqual({
        name: "Ethereum",
      });
    });

    it("opens by name when the config declares no minVersion", () => {
      const config = createConfig("Ethereum", [{ name: "Ethereum" }]);

      expect(createOpenAppConfig(config)).toEqual({
        application: { name: "Ethereum" },
        dependencies: [{ name: "Ethereum" }],
        requireLatestFirmware: false,
      });
    });
  });
});

import type {
  ApplicationDependency,
  ApplicationVersionConstraint,
  OpenAppWithDependenciesDAInput,
} from "@ledgerhq/device-management-kit";

import type {
  BlockchainAppDependency,
  BlockchainConfig,
} from "../../model/dappConfig/BlockchainConfig";

const COMPARATOR_PREFIX = /^(>=|<=|>|<|=|\^|~)/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function toApplicationVersionConstraint(
  minVersion: string,
): ApplicationVersionConstraint | undefined {
  const trimmed = minVersion.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const withoutComparator = trimmed.replace(COMPARATOR_PREFIX, "").trim();
  if (withoutComparator === "latest") {
    return "latest";
  }

  if (!SEMVER.test(withoutComparator)) {
    return undefined;
  }

  return withoutComparator as ApplicationVersionConstraint;
}

function toApplicationDependency({
  name,
  minVersion,
}: BlockchainAppDependency): ApplicationDependency {
  if (!minVersion) {
    return { name };
  }

  const parsed = toApplicationVersionConstraint(minVersion);
  if (!parsed) {
    return { name };
  }

  return { name, constraints: [{ minVersion: parsed }] };
}

/**
 * Builds the DMK open-app input from a blockchain's dApp config, mapping
 * `minVersion` onto `ApplicationDependency.constraints`.
 */
export function createOpenAppConfig(
  blockchainConfig: BlockchainConfig,
): OpenAppWithDependenciesDAInput {
  const { appName, dependencies } = blockchainConfig.appDependencies;
  const mappedDependencies = dependencies.map(toApplicationDependency);
  const matchingDependency = mappedDependencies.find(
    (dependency) => dependency.name === appName,
  );

  return {
    application: matchingDependency ?? { name: appName },
    dependencies: mappedDependencies,
    requireLatestFirmware: false,
  };
}

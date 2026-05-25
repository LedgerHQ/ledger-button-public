import { describe, expect, it } from "vitest";

import { isSupportedCluster, SUPPORTED_CLUSTERS } from "./supportedClusters.js";

describe("supportedClusters", () => {
  describe("isSupportedCluster", () => {
    it.each(SUPPORTED_CLUSTERS)("should return true for %s", (cluster) => {
      expect(isSupportedCluster(cluster)).toBe(true);
    });

    it.each(["mainnet", "", " devnet ", "unknown"])(
      'should return false for "%s"',
      (cluster) => {
        expect(isSupportedCluster(cluster)).toBe(false);
      },
    );
  });
});

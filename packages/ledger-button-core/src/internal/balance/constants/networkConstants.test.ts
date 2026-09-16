import { describe, expect, it } from "vitest";

import { getCoinServiceNetworkName } from "./networkConstants.js";

describe("getCoinServiceNetworkName", () => {
  it.each([
    ["1", "ethereum"],
    ["137", "polygon"],
    ["5042", "arc"],
  ])("should return the CoinService network name %s for chain ID %s", (chainId, name) => {
    expect(getCoinServiceNetworkName(chainId)).toBe(name);
  });

  it("should return undefined for an unmapped chain ID", () => {
    expect(getCoinServiceNetworkName("999999999")).toBeUndefined();
  });
});

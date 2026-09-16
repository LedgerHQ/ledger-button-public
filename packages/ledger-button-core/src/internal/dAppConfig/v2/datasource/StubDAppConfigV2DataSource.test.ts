import { describe, expect, it } from "vitest";

import { Config } from "../../../config/model/config.js";
import { StubDAppConfigV2DataSource } from "./StubDAppConfigV2DataSource.js";

function createDataSource(dAppIdentifier: string) {
  const config = new Config({
    originToken: "token",
    dAppIdentifier,
  });
  return new StubDAppConfigV2DataSource(config);
}

describe("StubDAppConfigV2DataSource", () => {
  it("should return the matching stub config for a known dApp identifier", async () => {
    const dataSource = createDataSource("okx");
    const result = await dataSource.getDAppConfig();
    expect(result.liveAppId).toBe("okx");
  });

  it("should fall back to the default Ledger config for an unknown dApp identifier", async () => {
    const dataSource = createDataSource("some-unonboarded-dapp");
    const result = await dataSource.getDAppConfig();
    expect(result.liveAppId).toBe("ledger");
  });

  it("should include Arc in the default EVM networks", async () => {
    const dataSource = createDataSource("ledger");
    const result = await dataSource.getDAppConfig();
    const ethereumBlockchain = result.blockchains.find(
      (b) => b.blockchain === "ethereum",
    );
    expect(ethereumBlockchain?.networks).toContainEqual(
      expect.objectContaining({
        id: "5042",
        currencyId: "arc",
        currencyTicker: "ARC",
      }),
    );
  });
});

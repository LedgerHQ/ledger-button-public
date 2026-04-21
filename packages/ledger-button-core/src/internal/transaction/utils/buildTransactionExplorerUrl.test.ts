import { describe, expect, it } from "vitest";

import { buildTransactionExplorerUrl } from "./buildTransactionExplorerUrl.js";

const HASH =
  "0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd";

describe("buildTransactionExplorerUrl", () => {
  it("resolves the explorer URL by replacing the ${hash} placeholder", () => {
    const url = buildTransactionExplorerUrl(
      HASH,
      "https://etherscan.io/tx/${hash}",
    );

    expect(url).toBe(`https://etherscan.io/tx/${HASH}`);
  });

  it("replaces every occurrence of ${hash} in the template", () => {
    const url = buildTransactionExplorerUrl(
      HASH,
      "https://explorer.test/tx/${hash}?ref=${hash}",
    );

    expect(url).toBe(`https://explorer.test/tx/${HASH}?ref=${HASH}`);
  });

  it("returns the template unchanged when it contains no placeholder", () => {
    const url = buildTransactionExplorerUrl(HASH, "https://explorer.test/home");

    expect(url).toBe("https://explorer.test/home");
  });

  it("returns null when no template is provided", () => {
    expect(buildTransactionExplorerUrl(HASH, undefined)).toBeNull();
  });

  it("returns null for an empty-string template", () => {
    expect(buildTransactionExplorerUrl(HASH, "")).toBeNull();
  });
});

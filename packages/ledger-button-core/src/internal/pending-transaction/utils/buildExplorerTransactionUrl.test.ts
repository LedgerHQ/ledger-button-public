import { describe, expect, it } from "vitest";

import { buildExplorerTransactionUrl } from "./buildExplorerTransactionUrl.js";

const HASH =
  "0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd";

describe("buildExplorerTransactionUrl", () => {
  it("resolves the explorer URL by replacing the ${hash} placeholder", () => {
    const url = buildExplorerTransactionUrl(
      "https://etherscan.io/tx/${hash}",
      HASH,
    );

    expect(url).toBe(`https://etherscan.io/tx/${HASH}`);
  });

  it("replaces every occurrence of ${hash} in the template", () => {
    const url = buildExplorerTransactionUrl(
      "https://explorer.test/tx/${hash}?ref=${hash}",
      HASH,
    );

    expect(url).toBe(`https://explorer.test/tx/${HASH}?ref=${HASH}`);
  });

  it("returns the template unchanged when it contains no placeholder", () => {
    const url = buildExplorerTransactionUrl("https://explorer.test/home", HASH);

    expect(url).toBe("https://explorer.test/home");
  });

  it("returns null when no template is provided", () => {
    expect(buildExplorerTransactionUrl(undefined, HASH)).toBeNull();
  });

  it("returns null for an empty-string template", () => {
    expect(buildExplorerTransactionUrl("", HASH)).toBeNull();
  });
});

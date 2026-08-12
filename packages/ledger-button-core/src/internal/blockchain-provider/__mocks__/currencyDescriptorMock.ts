import type { CurrencyDescriptor } from "@api/blockchain-provider/model/CurrencyDescriptor.js";

/**
 * Builds a {@link CurrencyDescriptor} for tests, defaulting to Ethereum
 * mainnet. Pass `overrides` to tune individual fields.
 */
export function aCurrencyDescriptor(
  overrides: Partial<CurrencyDescriptor> = {},
): CurrencyDescriptor {
  return {
    currencyId: "ethereum",
    family: "ethereum",
    network: { networkId: "1", blockchainName: "ethereum" },
    nativeDecimals: 18,
    ...overrides,
  };
}

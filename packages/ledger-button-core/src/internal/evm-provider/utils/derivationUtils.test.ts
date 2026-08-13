import type { ProviderAccount } from "@api/model/blockchain/ProviderAccount.js";

import { getEvmDerivationPath } from "./derivationUtils.js";

function createAccount(
  overrides: Partial<ProviderAccount> = {},
): ProviderAccount {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    derivationMode: "",
    index: 0,
    ...overrides,
  };
}

describe("getEvmDerivationPath", () => {
  it.each([
    { derivationMode: "ethM", index: 0, expected: "44'/60'/0'/0" },
    { derivationMode: "ethM", index: 3, expected: "44'/60'/0'/3" },
    { derivationMode: "ethMM", index: 0, expected: "44'/60'/0'/0/0" },
    { derivationMode: "ethMM", index: 5, expected: "44'/60'/0'/0/5" },
    { derivationMode: "etcM", index: 0, expected: "44'/60'/160720'/0'/0" },
    { derivationMode: "etcM", index: 2, expected: "44'/60'/160720'/0'/2" },
  ])(
    "should resolve $derivationMode (index $index) to $expected",
    ({ derivationMode, index, expected }) => {
      const account = createAccount({ derivationMode, index });
      expect(getEvmDerivationPath(account)).toBe(expected);
    },
  );

  it.each([
    { derivationMode: "", index: 0, expected: "44'/60'/0'/0/0" },
    { derivationMode: "", index: 4, expected: "44'/60'/4'/0/0" },
    { derivationMode: "default", index: 1, expected: "44'/60'/1'/0/0" },
    { derivationMode: "unknown-mode", index: 7, expected: "44'/60'/7'/0/0" },
  ])(
    "should fall back to the default Ledger Live path for $derivationMode (index $index)",
    ({ derivationMode, index, expected }) => {
      const account = createAccount({ derivationMode, index });
      expect(getEvmDerivationPath(account)).toBe(expected);
    },
  );
});

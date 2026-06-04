import { Account } from "../../account/service/AccountService.js";
import { getSolanaDerivationPath } from "./derivationUtils.js";

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    currencyId: "solana",
    freshAddress: "11111111111111111111111111111111",
    seedIdentifier: "seed-1",
    derivationMode: "solanaSub",
    index: 0,
    name: "My Solana Account",
    ticker: "SOL",
    balance: undefined,
    tokens: [],
    ...overrides,
  };
}

describe("getSolanaDerivationPath", () => {
  it.each([
    { derivationMode: "solanaMain", index: 0, expected: "44'/501'" },
    { derivationMode: "solanaMain", index: 3, expected: "44'/501'" },
    { derivationMode: "solanaBip44Change", index: 0, expected: "44'/501'/0'/0'" },
    { derivationMode: "solanaBip44Change", index: 2, expected: "44'/501'/2'/0'" },
    { derivationMode: "solanaSub", index: 0, expected: "44'/501'/0'" },
    { derivationMode: "solanaSub", index: 4, expected: "44'/501'/4'" },
  ])(
    "should resolve $derivationMode (index $index) to $expected",
    ({ derivationMode, index, expected }) => {
      const account = createAccount({ derivationMode, index });
      expect(getSolanaDerivationPath(account)).toBe(expected);
    },
  );

  it.each([
    { derivationMode: "", index: 0, expected: "44'/501'/0'" },
    { derivationMode: "unknown-mode", index: 6, expected: "44'/501'/6'" },
  ])(
    "should fall back to solanaSub for $derivationMode (index $index)",
    ({ derivationMode, index, expected }) => {
      const account = createAccount({ derivationMode, index });
      expect(getSolanaDerivationPath(account)).toBe(expected);
    },
  );
});

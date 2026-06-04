import { Account } from "./service/AccountService.js";
import { getDerivationPath } from "./AccountUtils.js";

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    seedIdentifier: "seed-1",
    derivationMode: "",
    index: 0,
    name: "My Account",
    ticker: "ETH",
    balance: undefined,
    tokens: [],
    ...overrides,
  };
}

describe("getDerivationPath", () => {
  it("should dispatch to the Solana resolver for Solana currencies", () => {
    const account = createAccount({
      currencyId: "solana",
      derivationMode: "solanaBip44Change",
      index: 1,
    });
    expect(getDerivationPath(account)).toBe("44'/501'/1'/0'");
  });

  it("should dispatch to the EVM resolver for non-Solana currencies", () => {
    const account = createAccount({
      currencyId: "ethereum",
      derivationMode: "ethMM",
      index: 2,
    });
    expect(getDerivationPath(account)).toBe("44'/60'/0'/0/2");
  });

  it("should use the default EVM path when the mode is unknown", () => {
    const account = createAccount({
      currencyId: "polygon",
      derivationMode: "default",
      index: 3,
    });
    expect(getDerivationPath(account)).toBe("44'/60'/3'/0/0");
  });
});

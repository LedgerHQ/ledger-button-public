import { ledgerButtonAccounts } from "./ledger-button-accounts.js";

describe("ledgerButtonAccounts", () => {
  it("should work", () => {
    expect(ledgerButtonAccounts()).toEqual("ledger-button-accounts");
  });
});

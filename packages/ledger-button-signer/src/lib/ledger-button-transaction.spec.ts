import { ledgerButtonTransaction } from "./ledger-button-transaction.js";

describe("ledgerButtonTransaction", () => {
  it("should work", () => {
    expect(ledgerButtonTransaction()).toEqual("ledger-button-transaction");
  });
});

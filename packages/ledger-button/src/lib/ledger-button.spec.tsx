import { render } from "@testing-library/react";

import LedgerButton from "./ledger-button";

describe("LedgerButton", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<LedgerButton />);
    expect(baseElement).toBeTruthy();
  });
});

import { render } from "@testing-library/react";

import LedgerButtonUi from "./ledger-button-ui";

describe("LedgerButtonUi", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<LedgerButtonUi />);
    expect(baseElement).toBeTruthy();
  });
});

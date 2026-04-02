import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";

export class MobileOnboardingController implements ReactiveController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  redirectToLedgerWallet() {
    const redirectUrl =
      "ledgerlive://discover/" +
      this.core.getConfig().dAppIdentifier +
      "?referrer=LedgerButton_v" +
      this.core.getConfig().version;

    window.open(redirectUrl, "_blank", "noopener,noreferrer");
  }

  downloadLedgerWallet() {
    window.open(
      "https://shop.ledger.com/pages/ledger-wallet#download-ledger-wallet",
      "_blank",
      "noopener,noreferrer",
    );
  }
}

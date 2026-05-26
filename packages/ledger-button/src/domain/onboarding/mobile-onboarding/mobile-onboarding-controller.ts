import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";
import { type LanguageContext } from "../../../context/language-context.js";
import { getLedgerWalletDownloadUrl } from "../../../shared/constants/shop-urls.js";

export class MobileOnboardingController implements ReactiveController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly lang: LanguageContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  get ledgerWalletUrl(): string {
    return (
      "ledgerlive://discover/" +
      this.core.getConfig().dAppIdentifier +
      "?referrer=LedgerButton_v" +
      this.core.getConfig().version
    );
  }

  trackRedirectToLedgerWallet() {
    void this.core.trackMobileRedirectLedgerWallet();
  }

  downloadLedgerWallet() {
    window.open(
      getLedgerWalletDownloadUrl(this.lang.currentLanguage),
      "_blank",
      "noopener,noreferrer",
    );
  }
}

import type {
  Account,
  LedgerButtonCore,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, type ReactiveControllerHost } from "lit";

export class LedgerButtonAppController implements ReactiveController {
  host: ReactiveControllerHost;
  readonly core: LedgerButtonCore;

  constructor(host: ReactiveControllerHost, core: LedgerButtonCore) {
    this.host = host;
    this.core = core;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
    this.setupSelectedAccount();
  }

  setupSelectedAccount() {
    const selectedAccount = this.core.getSelectedAccount();
    if (!selectedAccount) return;

    window.dispatchEvent(
      new CustomEvent<{ account: Account }>(
        "ledger-provider-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account: selectedAccount },
        },
      ),
    );
  }
}

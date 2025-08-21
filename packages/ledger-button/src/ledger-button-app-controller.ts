import { AccountItemClickEventDetail } from "@ledgerhq/ledger-button-ui";
import { ReactiveController, ReactiveControllerHost } from "lit";

export class LedgerButtonAppController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  handleAccountSelected(e: CustomEvent<AccountItemClickEventDetail>) {
    window.dispatchEvent(
      new CustomEvent<{ accounts: string[] }>(
        "ledger-provider-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { accounts: [e.detail.address] },
        },
      ),
    );
  }
}

import {
  Account,
  AccountListItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../shared/navigation";
import { RootNavigationComponent } from "../../shared/root-navigation";

export class AccountTokenController implements ReactiveController {
  account: AccountListItem | null;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly navigation: Navigation,
    staleAccount?: AccountListItem,
  ) {
    this.account = staleAccount ?? null;
    this.host.addController(this);
  }

  hostConnected() {
    if (!this.account) {
      this.navigation.navigateBack();
    }
  }

  handleConnect = () => {
    if (!this.account) {
      return;
    }

    this.selectAccount(this.account);

    window.dispatchEvent(
      new CustomEvent<{ account: Account; status: "success" }>(
        "ledger-internal-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account: this.account, status: "success" },
        },
      ),
    );

    this.close();
  };

  selectAccount = (account: Account) => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
    }
  };

  close = () => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  };
}

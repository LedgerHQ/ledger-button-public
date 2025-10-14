import "../../../shared/root-navigation.js";

import { Account } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import type { AccountItemClickEventDetail } from "../../../components/molecule/account-item/ledger-account-item.js";
import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
export class SelectAccountController implements ReactiveController {
  accounts: Account[] = [];

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccounts();
  }

  async getAccounts() {
    const accounts = await this.core.getAccounts();
    this.accounts = accounts ?? [];
    this.host.requestUpdate();
  }

  selectAccount(address: string) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      //this.core.selectAccount(address);
      this.navigation.host.selectAccount(address);
      this.host.requestUpdate();
    }
  }

  handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    this.selectAccount(event.detail.address);
    const selectedAccount = this.core.getSelectedAccount();
    window.dispatchEvent(
      new CustomEvent<{ account: Account; status: "success" }>(
        "ledger-internal-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account: selectedAccount as Account, status: "success" },
        },
      ),
    );
    this.close();
  };

  handleAccountItemShowTokensClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    const account = this.core
      .getAccounts()
      .find((acc) => acc.freshAddress === event.detail.address);

    if (account) {
      this.core.setPendingAccountAddress(account.freshAddress);

      this.navigation.navigateTo({
        name: "accountTokens",
        component: "account-tokens-screen",
        canGoBack: true,
        toolbar: {
          title: `${account.name}`,
          canClose: true,
        },
      });
    }
  };

  close = () => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  };
}

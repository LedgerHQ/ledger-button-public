import "../../../shared/root-navigation.js";

import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import type { AccountItemClickEventDetail } from "../../../components/molecule/account-item/ledger-account-item.js";
import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
export class SelectAccountController implements ReactiveController {
  accounts: Account[] = [];

  get isBalanceLoading(): boolean {
    return this.accounts.some((account) => account.balance === undefined);
  }

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

  selectAccount(account: Account) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.host.requestUpdate();
    }
  }

  handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    const account = this.core
      .getAccounts()
      .find((acc) => acc.id === event.detail.ledgerId);

    if (account) {
      this.selectAccount(account);
    }

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
      .find((acc) => acc.id === event.detail.ledgerId);

    if (account) {
      this.core.setPendingAccountId(account.id);

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
      if (this.navigation.host.getModalMode() === "panel") {
        this.navigation.host.navigateToHome();
      } else {
        this.navigation.host.closeModal();
      }
      this.host.requestUpdate();
    }
  };
}

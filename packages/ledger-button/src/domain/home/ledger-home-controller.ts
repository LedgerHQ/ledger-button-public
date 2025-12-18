import { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";

export class LedgerHomeController implements ReactiveController {
  selectedAccount: Account | undefined = undefined;
  loading = false;
  contextSubscription: Subscription | undefined = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host.addController(this);
  }

  async getSelectedAccount() {
    this.loading = true;
    this.selectedAccount = await this.core.getDetailedSelectedAccount();
    if (!this.selectedAccount) {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
    }
    this.loading = false;
    this.startListeningToContextChanges();
    this.host.requestUpdate();
  }

  startListeningToContextChanges() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core
      .observeContext()
      .subscribe((_context) => {
        if (
          _context.selectedAccount?.name !== this.selectedAccount?.name ||
          _context.selectedAccount?.currencyId !==
            this.selectedAccount?.currencyId
        ) {
          this.getSelectedAccount();
        }
      });
  }

  hostConnected() {
    this.getSelectedAccount();
    this.host.requestUpdate();
  }

  hostDisconnected() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }
  }
}

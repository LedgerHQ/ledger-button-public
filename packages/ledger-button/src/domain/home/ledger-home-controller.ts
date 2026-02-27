import { DetailedAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";

export class LedgerHomeController implements ReactiveController {
  selectedAccount: DetailedAccount | undefined = undefined;
  loading = false;
  contextSubscription: Subscription | undefined = undefined;
  private isConnected = false;

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
    this.host.requestUpdate();

    const result = await this.core.getDetailedSelectedAccount();

    if (!this.isConnected) return;

    result.caseOf({
      Left: () => {
        this.selectedAccount = undefined;
        this.navigation.navigateTo(this.destinations.onboardingFlow);
      },
      Right: (account) => {
        this.selectedAccount = account;
      },
    });

    this.loading = false;
    this.host.requestUpdate();
  }

  private startListeningToContextChanges() {
    if (!this.isConnected) return;

    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core
      .observeContext()
      .subscribe((_context) => {
        if (
          _context.selectedAccount?.freshAddress !==
            this.selectedAccount?.freshAddress ||
          _context.selectedAccount?.currencyId !==
            this.selectedAccount?.currencyId
        ) {
          this.getSelectedAccount();
        }
      });
  }

  hostConnected() {
    this.isConnected = true;
    this.startListeningToContextChanges();
  }

  hostDisconnected() {
    this.isConnected = false;
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }
  }
}

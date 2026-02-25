import type { DetailedAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";

export class TokenListController implements ReactiveController {
  account: DetailedAccount | undefined = undefined;
  loading = false;
  contextSubscription: Subscription | undefined = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this);
  }

  async getSelectedAccount() {
    this.loading = true;

    const result = await this.core.getDetailedSelectedAccount();

    result.caseOf({
      Left: () => {
        this.account = undefined;
      },
      Right: (acc) => {
        this.account = acc;
      },
    });

    this.loading = false;
    this.startListeningToContextChanges();
    this.host.requestUpdate();
  }

  private startListeningToContextChanges() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core
      .observeContext()
      .subscribe((_context) => {
        if (
          _context.selectedAccount?.name !== this.account?.name ||
          _context.selectedAccount?.currencyId !== this.account?.currencyId
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

import {
  type Device,
  type SignTransactionParams,
} from "@ledgerhq/ledger-button-core";
import {
  type AuthContext,
  AuthenticateResponse,
  Device,
  LedgerButtonCore,
  LedgerSyncAuthenticationError,
  type UserInteractionNeeded,
} from "@ledgerhq/ledger-button-core";
import { AnimationKey } from "@ledgerhq/ledger-button-ui";
import { type ReactiveController, type ReactiveControllerHost } from "lit";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { type CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { type Destinations } from "../../../shared/routes.js";

export class LedgerSyncController implements ReactiveController {
  device?: Device;
  animation: AnimationKey = "continueOnLedger";
  ledgerSyncSubscription: Subscription | undefined = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getConnectedDevice();
  }

  async getConnectedDevice() {
    const device = await this.core.getConnectedDevice();

    if (!device) {
      this.navigation.navigateTo(this.destinations.onboarding);
      return;
    }

    this.device = device;
    this.host.requestUpdate();
    this.triggerLedgerSync();
  }

  triggerLedgerSync() {
    if (this.ledgerSyncSubscription) {
      return;
    }

    this.ledgerSyncSubscription = this.core
      .connectToLedgerSync()
      .subscribe((value: AuthenticateResponse) => {
        console.info("Ledger sync response", { value });
        switch (true) {
          case isAuthContext(value):
            this.navigation.navigateTo(this.destinations.fetchAccounts);
            this.host.requestUpdate();
            break;
          case isUserInteractionNeeded(value):
            console.log(`user interaction needed of type ${value.type}`);
            this.animation = "continueOnLedger";
            this.host.requestUpdate();
            //TODO: Handle user interaction needed
            break;
          case value instanceof LedgerSyncAuthenticationError:
            this.navigation.navigateTo(this.destinations.turnOnSync);
            this.host.requestUpdate();
            break;
        }
      });
  }
}

function isAuthContext(value: AuthenticateResponse): value is AuthContext {
  return (
    (<AuthContext>value).trustChainId !== undefined &&
    (<AuthContext>value).applicationPath !== undefined
  );
}

function isUserInteractionNeeded(
  value: AuthenticateResponse,
): value is UserInteractionNeeded {
  return (<UserInteractionNeeded>value).type !== undefined;
}

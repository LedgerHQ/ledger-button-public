import {
  type AuthContext,
  Device,
  type LedgerSyncAuthenticateResponse,
  LedgerSyncAuthenticationError,
  type UserInteractionNeeded,
} from "@ledgerhq/ledger-button-core";
import { type ReactiveController, type ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { AnimationKey } from "../../../components/molecule/device-animation/device-animation.js";
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
    this.host.requestUpdate();
    this.triggerLedgerSync();
  }

  triggerLedgerSync() {
    if (this.ledgerSyncSubscription) {
      return;
    }

    this.ledgerSyncSubscription = this.core
      .connectToLedgerSync()
      .subscribe((value: LedgerSyncAuthenticateResponse) => {
        console.info("Ledger sync response", { value });
        switch (true) {
          case this.isAuthContext(value):
            this.host.requestUpdate();
            break;
          case this.isUserInteractionNeeded(value):
            console.log(`user interaction needed of type ${value.type}`);
            //TODO: Handle user interaction needed
            this.animation =
              value.type === "unlock-device" ? "pin" : "continueOnLedger";
            this.host.requestUpdate();
            break;
          case value instanceof LedgerSyncAuthenticationError:
            console.log("Ledger sync authentication error", value);
            this.navigation.navigateTo(this.destinations.turnOnSync);
            break;
        }
      });
  }

  private isUserInteractionNeeded(
    value: LedgerSyncAuthenticateResponse,
  ): value is UserInteractionNeeded {
    return (<UserInteractionNeeded>value).type !== undefined;
  }

  private isAuthContext(
    value: LedgerSyncAuthenticateResponse,
  ): value is AuthContext {
    return (
      (<AuthContext>value).trustChainId !== undefined &&
      (<AuthContext>value).applicationPath !== undefined
    );
  }
}

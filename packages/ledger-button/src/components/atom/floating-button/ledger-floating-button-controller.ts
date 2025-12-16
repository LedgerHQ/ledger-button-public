import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../../context/core-context.js";

export class FloatingButtonController implements ReactiveController {
  host: ReactiveControllerHost;
  contextSubscription: Subscription | undefined = undefined;
  isConnected = false;
  isModalOpen = false;

  constructor(
    host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.updateConnectionState();
    this.subscribeToContext();
    this.subscribeToModalEvents();
  }

  hostDisconnected(): void {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }
    window.removeEventListener("ledger-core-modal-open", this.handleModalOpen);
    window.removeEventListener(
      "ledger-core-modal-close",
      this.handleModalClose,
    );
  }

  private subscribeToContext() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core.observeContext().subscribe(() => {
      this.updateConnectionState();
      this.host.requestUpdate();
    });
  }

  private updateConnectionState() {
    const selectedAccount = this.core.getSelectedAccount();
    this.isConnected =
      selectedAccount !== null && selectedAccount !== undefined;
  }

  private subscribeToModalEvents() {
    window.addEventListener("ledger-core-modal-open", this.handleModalOpen);
    window.addEventListener("ledger-core-modal-close", this.handleModalClose);
  }

  private handleModalOpen = () => {
    this.isModalOpen = true;
    this.host.requestUpdate();
  };

  private handleModalClose = () => {
    this.isModalOpen = false;
    this.host.requestUpdate();
  };

  get shouldShow(): boolean {
    return this.isConnected && !this.isModalOpen;
  }
}

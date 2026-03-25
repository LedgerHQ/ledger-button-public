import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../../context/core-context.js";

const MODAL_OPEN_EVENT = "ledger-core-modal-open";
const MODAL_CLOSE_EVENT = "ledger-core-modal-close";

export class FloatingButtonController implements ReactiveController {
  host: ReactiveControllerHost;
  private contextSubscription: Subscription | undefined = undefined;
  private pendingTxSubscription: Subscription | undefined = undefined;
  isConnected = false;
  pendingTransactionCount = 0;
  postClosePendingTooltipOpen = false;

  private _modalIsOpen = false;
  private _pendingIncreasedWhileModalOpen = false;
  private _previousPendingCount: number | undefined;

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
    this.subscribeToPendingTransactions();
    window.addEventListener(MODAL_OPEN_EVENT, this.handleModalOpen);
    window.addEventListener(MODAL_CLOSE_EVENT, this.handleModalClose);
  }

  hostDisconnected(): void {
    window.removeEventListener(MODAL_OPEN_EVENT, this.handleModalOpen);
    window.removeEventListener(MODAL_CLOSE_EVENT, this.handleModalClose);
    this.contextSubscription?.unsubscribe();
    this.pendingTxSubscription?.unsubscribe();
  }

  clearPostClosePendingTooltip(): void {
    this.postClosePendingTooltipOpen = false;
    this.host.requestUpdate();
  }

  private handleModalOpen = (): void => {
    this._modalIsOpen = true;
  };

  private handleModalClose = (): void => {
    this._modalIsOpen = false;
    if (
      this._pendingIncreasedWhileModalOpen &&
      this.pendingTransactionCount > 0
    ) {
      this.postClosePendingTooltipOpen = true;
    }
    this._pendingIncreasedWhileModalOpen = false;
    this.host.requestUpdate();
  };

  private subscribeToContext() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core.observeContext().subscribe(() => {
      this.updateConnectionState();
      this.host.requestUpdate();
    });
  }

  private subscribeToPendingTransactions() {
    if (this.pendingTxSubscription) {
      this.pendingTxSubscription.unsubscribe();
    }

    this.pendingTxSubscription = this.core
      .observePendingTransactions()
      .subscribe((txs) => {
        const nextCount = txs.length;
        this.pendingTransactionCount = nextCount;

        if (
          this.isConnected &&
          this._modalIsOpen &&
          this._previousPendingCount !== undefined &&
          nextCount > this._previousPendingCount
        ) {
          this._pendingIncreasedWhileModalOpen = true;
        }

        this._previousPendingCount = nextCount;
        this.host.requestUpdate();
      });
  }

  private updateConnectionState() {
    const selectedAccount = this.core.getSelectedAccount();
    const nextConnected =
      selectedAccount !== null && selectedAccount !== undefined;

    if (!nextConnected) {
      this._previousPendingCount = undefined;
      this._pendingIncreasedWhileModalOpen = false;
      this.postClosePendingTooltipOpen = false;
    }

    this.isConnected = nextConnected;
  }

  get shouldShow(): boolean {
    return this.isConnected;
  }
}

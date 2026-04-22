import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../../context/core-context.js";

const MODAL_OPEN_EVENT = "ledger-core-modal-open";
const MODAL_CLOSE_EVENT = "ledger-core-modal-close";
/**
 * Single "the FB can take over now" cue. Fires at morph-landed for
 * morph closes and at animation-complete for regular closes — see
 * `RootNavigationComponent#handleModalCloseFinished`.
 */
const MODAL_CLOSE_FINISHED_EVENT = "ledger-core-modal-close-finished";

const TOOLTIP_DISMISS_DELAY_MS = 300;
const POST_CLOSE_APPEARANCE_DELAY_MS = 500;

export class FloatingButtonController implements ReactiveController {
  host: ReactiveControllerHost;
  private contextSubscription: Subscription | undefined = undefined;
  private pendingTxSubscription: Subscription | undefined = undefined;
  isConnected = false;
  pendingTransactionCount = 0;
  postClosePendingTooltipOpen = false;
  validatedCelebrationOpen = false;
  validatedCount = 0;
  frozenBadgeCount: number | null = null;
  dismissingTooltipContent: string | null = null;

  private _modalIsOpen = false;
  private _modalCloseAnimationInProgress = false;
  private _pendingIncreasedWhileModalOpen = false;
  private _previousPendingCount: number | undefined;
  private _dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private _postCloseTimer: ReturnType<typeof setTimeout> | null = null;

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
    window.addEventListener(
      MODAL_CLOSE_FINISHED_EVENT,
      this.handleModalCloseFinished,
    );
  }

  hostDisconnected(): void {
    window.removeEventListener(MODAL_OPEN_EVENT, this.handleModalOpen);
    window.removeEventListener(MODAL_CLOSE_EVENT, this.handleModalClose);
    window.removeEventListener(
      MODAL_CLOSE_FINISHED_EVENT,
      this.handleModalCloseFinished,
    );
    this.contextSubscription?.unsubscribe();
    this.pendingTxSubscription?.unsubscribe();
    this.validatedCelebrationOpen = false;
    this.validatedCount = 0;
    this.clearDismissTimer();
    this.clearPostCloseTimer();
  }

  get hasPending(): boolean {
    return this.pendingTransactionCount > 0;
  }

  get needsTooltip(): boolean {
    return this.hasPending || this.validatedCelebrationOpen;
  }

  get modalIsOpen(): boolean {
    return this._modalIsOpen;
  }

  handleTooltipAutoHide(fallbackText: string): void {
    if (this.validatedCelebrationOpen) {
      this.clearValidatedCelebration();
      return;
    }
    this.dismissingTooltipContent = fallbackText;
    this.clearPostClosePendingTooltip();
    this.clearDismissTimer();
    this._dismissTimer = setTimeout(() => {
      this.dismissingTooltipContent = null;
      this._dismissTimer = null;
      this.host.requestUpdate();
    }, TOOLTIP_DISMISS_DELAY_MS);
  }

  clearPostClosePendingTooltip(): void {
    this.postClosePendingTooltipOpen = false;
    this.host.requestUpdate();
  }

  clearValidatedCelebration(): void {
    this.validatedCelebrationOpen = false;
    this.validatedCount = 0;
    this.frozenBadgeCount = null;
    this.host.requestUpdate();
  }

  private clearDismissTimer(): void {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }

  private clearPostCloseTimer(): void {
    if (this._postCloseTimer) {
      clearTimeout(this._postCloseTimer);
      this._postCloseTimer = null;
    }
  }

  private handleModalOpen = (): void => {
    this._modalIsOpen = true;
    this._modalCloseAnimationInProgress = false;
    this.host.requestUpdate();
  };

  private handleModalClose = (): void => {
    this._modalIsOpen = false;
    this._modalCloseAnimationInProgress = true;
    const shouldShowPostClose =
      this._pendingIncreasedWhileModalOpen &&
      this.pendingTransactionCount > 0;
    this._pendingIncreasedWhileModalOpen = false;

    if (shouldShowPostClose) {
      this.clearPostCloseTimer();
      this._postCloseTimer = setTimeout(() => {
        this._postCloseTimer = null;
        this.postClosePendingTooltipOpen = true;
        this.host.requestUpdate();
      }, POST_CLOSE_APPEARANCE_DELAY_MS);
    } else {
      this.host.requestUpdate();
    }
  };

  private handleModalCloseFinished = (): void => {
    this._modalCloseAnimationInProgress = false;
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
        const previousCount = this._previousPendingCount;

        this.pendingTransactionCount = nextCount;

        if (
          previousCount !== undefined &&
          previousCount > 0 &&
          nextCount < previousCount
        ) {
          this.frozenBadgeCount = previousCount;
          this.validatedCelebrationOpen = true;
          this.validatedCount = previousCount - nextCount;
          this.postClosePendingTooltipOpen = false;
        }

        if (
          this.isConnected &&
          this._modalIsOpen &&
          (previousCount === undefined || nextCount > previousCount)
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
      this.validatedCelebrationOpen = false;
      this.validatedCount = 0;
    }

    this.isConnected = nextConnected;
  }

  get shouldShow(): boolean {
    return (
      this.isConnected &&
      !this._modalIsOpen &&
      !this._modalCloseAnimationInProgress
    );
  }
}

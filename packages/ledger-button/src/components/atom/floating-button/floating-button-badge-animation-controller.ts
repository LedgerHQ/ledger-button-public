import type { ReactiveController, ReactiveControllerHost } from "lit";

import { FloatingButtonBadgeAnimation } from "./floating-button-badge-animation.js";

type BadgeVariant = "pending" | "validated";

type PendingAction =
  | "appear"
  | "transition-validated"
  | "transition-pending"
  | "exit";

export type BadgeQueryFn = () => HTMLElement | null;

export class BadgeAnimationController implements ReactiveController {
  animatedVariant: BadgeVariant | null = null;
  delayTooltipOpen = false;
  badgeAppearing = false;
  frozenCount: number | null = null;

  private _isAnimating = false;
  private _hasPending = false;
  private _celebration = false;
  private _previousCelebration = false;
  private _previousHasPending = false;
  private _previousPostCloseTooltip = false;
  private _deferredBadgeAppearance = false;
  private _pendingAction: PendingAction | null = null;

  private readonly animation = new FloatingButtonBadgeAnimation();

  constructor(
    private readonly host: ReactiveControllerHost & { updateComplete: Promise<boolean> },
    private readonly queryBadge: BadgeQueryFn,
  ) {
    this.host.addController(this);
  }

  // Required by ReactiveController interface
  hostConnected(): void {} // eslint-disable-line @typescript-eslint/no-empty-function

  hostDisconnected(): void {
    this.animation.cancel();
  }

  get isAnimating(): boolean {
    return this._isAnimating;
  }

  get deferredBadgeAppearance(): boolean {
    return this._deferredBadgeAppearance;
  }

  get showBadgeChrome(): boolean {
    return (
      (this._hasPending && !this._deferredBadgeAppearance) ||
      this._celebration ||
      this.badgeAppearing ||
      this._isAnimating
    );
  }

  get resolvedBadgeVariant(): BadgeVariant {
    return (
      this.animatedVariant ??
      (this._celebration ? "validated" : "pending")
    );
  }

  sync(
    celebration: boolean,
    hasPending: boolean,
    postCloseTooltip: boolean,
    modalIsOpen: boolean,
    pendingCount: number,
  ): void {
    this._celebration = celebration;
    this._hasPending = hasPending;

    const celebrationChanged = celebration !== this._previousCelebration;
    const pendingAppeared = hasPending && !this._previousHasPending;
    const postCloseTooltipAppeared =
      postCloseTooltip && !this._previousPostCloseTooltip;

    this._previousCelebration = celebration;
    this._previousHasPending = hasPending;
    this._previousPostCloseTooltip = postCloseTooltip;

    if (celebrationChanged) {
      if (celebration) {
        this.frozenCount = pendingCount;
        this._pendingAction = "transition-validated";
      } else if (hasPending) {
        this._pendingAction = "transition-pending";
      } else {
        this._pendingAction = "exit";
      }
    } else if (pendingAppeared && !this._isAnimating) {
      if (modalIsOpen) {
        this._deferredBadgeAppearance = true;
      } else {
        this._pendingAction = "appear";
      }
    } else if (
      postCloseTooltipAppeared &&
      this._deferredBadgeAppearance &&
      !this._isAnimating
    ) {
      this._pendingAction = "appear";
    }
  }

  flush(): void {
    const action = this._pendingAction;
    this._pendingAction = null;
    if (!action) return;

    switch (action) {
      case "appear":
        void this.animateBadgeAppearance();
        break;
      case "transition-validated":
        void this.transitionBadge("pending", "validated");
        break;
      case "transition-pending":
        void this.transitionBadge("validated", "pending");
        break;
      case "exit":
        void this.animateBadgeExit();
        break;
    }
  }

  cancel(): void {
    this.animation.cancel();
  }

  private async animateBadgeAppearance(): Promise<void> {
    this._isAnimating = true;
    this.badgeAppearing = true;
    this._deferredBadgeAppearance = false;
    this.animatedVariant = "pending";
    this.host.requestUpdate();
    await this.host.updateComplete;

    const el = this.queryBadge();
    if (el) {
      el.style.transform = "scale(0)";
      await this.animation.growIn(el);
    }

    this.badgeAppearing = false;
    this.animatedVariant = null;
    this._isAnimating = false;
    this.host.requestUpdate();
  }

  private async animateBadgeExit(): Promise<void> {
    if (this._isAnimating) {
      this.animation.cancel();
    }
    this._isAnimating = true;
    this.animatedVariant = "validated";
    this.host.requestUpdate();
    await this.host.updateComplete;

    const el = this.queryBadge();
    if (el) await this.animation.shrinkOut(el);

    this.animatedVariant = null;
    this._isAnimating = false;
    this.host.requestUpdate();
  }

  private async transitionBadge(
    from: BadgeVariant,
    to: BadgeVariant,
  ): Promise<void> {
    if (this._isAnimating) {
      this.animation.cancel();
    }
    this._isAnimating = true;
    if (to === "validated") this.delayTooltipOpen = true;
    this.animatedVariant = from;
    this.host.requestUpdate();
    await this.host.updateComplete;

    const shrinkEl = this.queryBadge();
    if (shrinkEl) await this.animation.shrinkOut(shrinkEl);

    this.frozenCount = null;
    this.animatedVariant = to;
    this.host.requestUpdate();
    await this.host.updateComplete;

    const growEl = this.queryBadge();
    if (growEl) await this.animation.growIn(growEl);

    this.delayTooltipOpen = false;
    this.animatedVariant = to === "pending" ? null : to;
    this._isAnimating = false;
    this.host.requestUpdate();
  }
}

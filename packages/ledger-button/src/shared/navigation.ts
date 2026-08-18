import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../context/core-context";
import { Destination, resolveCanGoBack } from "./routes";

export const ANIMATION_DELAY = 300;

/**
 * Options accepted by the modal close action exposed on the navigation host.
 *
 * `morph: true` triggers the curved shrink-and-fly animation that lands the
 * modal at the floating-button position. Anything else is a regular fade.
 */
export type CloseModalOptions = {
  morph?: boolean;
};

/**
 * Minimal contract every Navigation host must satisfy. Screens and feature
 * controllers can call `navigation.host.closeModal(...)` without doing an
 * `instanceof RootNavigationComponent` check just for that.
 *
 * Anything host-specific beyond this still needs to narrow to the concrete
 * host type explicitly.
 */
export interface NavigationHost extends ReactiveControllerHost {
  closeModal(options?: CloseModalOptions): void;
}

export class Navigation implements ReactiveController {
  host: NavigationHost;

  history: Destination[] = [];
  currentScreen: Destination | null = null;
  private navigationTimeoutId: number | null = null;

  constructor(
    host: NavigationHost,
    private readonly modalContent: HTMLElement,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    if (this.currentScreen) {
      this.host.requestUpdate();
    }
  }

  hostDisconnected() {
    this.clearNavigationTimeout();
    this.resetNavigation();
  }

  navigateTo(destination: Destination) {
    if (destination.name === this.currentScreen?.name) {
      this.currentScreen = destination;
      this.host.requestUpdate();
      return;
    }

    if (this.modalContent && this.currentScreen) {
      this.modalContent.classList.add("remove");
      this.clearNavigationTimeout();
      this.navigationTimeoutId = window.setTimeout(() => {
        this.modalContent.classList.remove("remove");
        if (!destination.skipHistory) {
          this.history.push(destination);
        }
        this.currentScreen = destination;
        this.host.requestUpdate();
        this.navigationTimeoutId = null;
      }, ANIMATION_DELAY);
      return;
    }

    if (!destination.skipHistory) {
      this.history.push(destination);
    }
    this.currentScreen = destination;
    this.host.requestUpdate();
  }

  navigateBack() {
    if (this.history.length > 1) {
      this.history.pop();
      this.currentScreen = this.history[this.history.length - 1];
    }
    this.host.requestUpdate();
  }

  resetNavigation() {
    this.clearNavigationTimeout();
    this.history = [];
    this.currentScreen = null;
    this.host.requestUpdate();
  }

  private clearNavigationTimeout() {
    if (this.navigationTimeoutId !== null) {
      window.clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }
  }

  canGoBack(destination?: Destination, core?: CoreContext): boolean {
    if (!core) {
      return false;
    }
    const canGoBack = resolveCanGoBack(destination?.canGoBack, core);
    return canGoBack && this.history.length > 1 && this.currentScreen !== null;
  }
}

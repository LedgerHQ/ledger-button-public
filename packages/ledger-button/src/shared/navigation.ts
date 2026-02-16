import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../context/core-context.js";
import { Destination, resolveCanGoBack } from "./routes.js";

export const ANIMATION_DELAY = 300;

export class Navigation implements ReactiveController {
  host: ReactiveControllerHost;

  history: Destination[] = [];
  currentScreen: Destination | null = null;
  private navigationTimeoutId: number | null = null;

  constructor(
    host: ReactiveControllerHost,
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

  updateCurrentScreen(updates: Partial<Destination>) {
    if (this.currentScreen) {
      this.currentScreen = {
        ...this.currentScreen,
        ...updates,
        toolbar: {
          ...this.currentScreen.toolbar,
          ...(updates.toolbar ?? {}),
        },
      };
      this.host.requestUpdate();
    }
  }

  navigateTo(destination: Destination) {
    if (destination.name === this.currentScreen?.name) {
      this.updateCurrentScreen(destination);
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

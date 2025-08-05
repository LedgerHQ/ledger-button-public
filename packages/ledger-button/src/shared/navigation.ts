import { ReactiveController, ReactiveControllerHost } from "lit";

import { Destination } from "./routes.js";

export class Navigation implements ReactiveController {
  host: ReactiveControllerHost;

  history: Destination[] = [];
  currentScreen: Destination | null = null;

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
    this.resetNavigation();
  }

  navigateTo(destination: Destination) {
    if (destination.name === this.currentScreen?.name) {
      return;
    }

    if (this.modalContent && this.currentScreen) {
      this.modalContent.classList.add("remove");
      setTimeout(() => {
        this.modalContent.classList.remove("remove");
        this.history.push(destination);
        this.currentScreen = destination;
        this.host.requestUpdate();
        // NOTE: The 250ms delay here is to allow for animation to complete
        // Could be a CONSTANT if required
      }, 250);
      return;
    }
    this.history.push(destination);
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
    this.history = [];
    this.currentScreen = null;
    this.host.requestUpdate();
  }

  canGoBack(destination?: Destination) {
    return (
      (destination?.canGoBack ?? true) &&
      this.history.length > 1 &&
      this.currentScreen !== null
    );
  }
}

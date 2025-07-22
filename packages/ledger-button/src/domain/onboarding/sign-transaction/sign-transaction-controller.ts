import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { destinations } from "../../../shared/routes.js";

export class SignTransactionController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  async startSigning() {
    try {
      // TODO: Replace with core signing
      await this.simulateSigningProcess();

      (this.host as any).state = "success";
      (this.host as any).transactionId = this.generateTransactionId();
      this.host.requestUpdate();
    } catch (error) {
      console.error("Failed to sign transaction", error);
      (this.host as any).state = "error";
      this.host.requestUpdate();
    }
  }

  viewTransactionDetails(transactionId: string) {
    console.log("Viewing transaction details for:", transactionId);
  }

  close() {
    this.navigation.navigateTo(destinations.home);
  }

  private async simulateSigningProcess() {
    // Similate time
    return new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }

  private generateTransactionId(): string {
    // Mock id
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }
}

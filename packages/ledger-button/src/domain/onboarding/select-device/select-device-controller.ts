import { type ReactiveController, type ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";

export class SelectDeviceController implements ReactiveController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  async clickAdItem() {
    await this.core
      .getReferralUrl()
      .then((url) => window.open(url, "_blank"))
      .catch((error) =>
        console.error("Failed to get a valid referral url", error),
      );
  }

  async connectToDevice(detail: {
    title: string;
    connectionType: "bluetooth" | "usb" | "";
    timestamp: number;
  }) {
    if (detail.connectionType === "") {
      console.log("No connection type selected");
      return;
    }

    try {
      await this.core.connectToDevice(detail.connectionType);
      /*
      const pendingTransactionParams = this.core.getPendingTransactionParams();
      if (pendingTransactionParams) {
        this.navigation.navigateTo(this.destinations.signTransaction);
        return;
      }

      this.navigation.navigateTo(this.destinations.ledgerSync);
      return;
      } else {
        this.navigation.navigateTo(this.destinations.onboardingFlow);
      }
      */
    } catch (error) {
      console.error("Failed to connect to device", error);
    }
  }
}

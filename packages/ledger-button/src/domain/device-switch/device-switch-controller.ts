import type { DeviceModelId } from "../../components/atom/icon/device-icon/device-icon.js";
import type { CoreContext } from "../../context/core-context.js";
import type { Navigation } from "../../shared/navigation.js";
import type { Destinations } from "../../shared/routes.js";

export class DeviceSwitchController {
  constructor(
    private readonly coreContext: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {}

  async connectNewDevice(connectionType: "bluetooth" | "usb") {
    try {
      await this.coreContext.connectToDevice(connectionType);
      this.navigation.navigateTo(this.destinations.onboardingFlow);
    } catch {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
    }
  }

  getConnectionTypeFromTransport(transport: string): "bluetooth" | "usb" | "" {
    const transportLower = transport.toLowerCase();

    if (
      transportLower.includes("ble") ||
      transportLower.includes("bluetooth")
    ) {
      return "bluetooth";
    }
    if (transportLower.includes("usb") || transportLower.includes("hid")) {
      return "usb";
    }
    return "";
  }

  mapDeviceModelId(deviceModelId?: string): DeviceModelId {
    if (!deviceModelId) {
      return "flex";
    }

    const modelStr = deviceModelId.toString();
    const transformedModel = modelStr.replace(/_/g, "");

    const validModels: DeviceModelId[] = [
      "stax",
      "flex",
      "nanoX",
      "nanoS",
      "nanoSP",
    ];

    if (validModels.includes(transformedModel as DeviceModelId)) {
      return transformedModel as DeviceModelId;
    }

    return "flex";
  }
}

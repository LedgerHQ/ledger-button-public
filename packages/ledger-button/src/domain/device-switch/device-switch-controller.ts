import type {
  DiscoveredDevice,
  KnownDeviceDbModel,
  mapToKnownDeviceDbModel,
} from "@ledgerhq/ledger-wallet-provider-core";
import { LitElement } from "lit";

import type { DeviceModelId } from "../../components/atom/icon/device-icon/device-icon.js";
import type { CoreContext } from "../../context/core-context.js";
import type { Navigation } from "../../shared/navigation.js";
import type { Destinations } from "../../shared/routes.js";

export type UnifiedDevice = {
  id: string;
  name: string;
  modelId: string;
  transport: string;
  isKnownDevice: boolean;
  isAvailable: boolean;
};

export class DeviceSwitchController {
  private unifiedDevices: UnifiedDevice[] = [];

  constructor(
    private readonly host: LitElement,
    private readonly coreContext: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {}

  async hostConnected() {
    await this.loadDevices();
  }

  async loadDevices() {
    try {
      const knownDevices = this.coreContext.getKnownDevices();

      let availableDevices: DiscoveredDevice[] = [];

      try {
        availableDevices = await this.coreContext.listAvailableDevices();
      } catch {
        // If we can't get available devices, we'll just show known devices
      }

      this.unifiedDevices = this.mergeDevices(knownDevices, availableDevices);

      this.host.requestUpdate();
    } catch {
      this.unifiedDevices = [];
      this.host.requestUpdate();
    }
  }

  private mergeDevices(
    knownDevices: KnownDeviceDbModel[],
    availableDevices: DiscoveredDevice[],
  ): UnifiedDevice[] {
    const merged: UnifiedDevice[] = [];
    const seenNames = new Set<string>();

    for (const device of availableDevices) {
      merged.push({
        id: device.id,
        name: device.name,
        modelId: device.deviceModel?.model ?? "",
        transport: device.transport,
        isKnownDevice: knownDevices.some((k) => k.name === device.name),
        isAvailable: true,
      });
      seenNames.add(device.name);
    }

    for (const device of knownDevices) {
      if (!seenNames.has(device.name)) {
        merged.push({
          id: device.id,
          name: device.name,
          modelId: device.modelId,
          transport: device.type,
          isKnownDevice: true,
          isAvailable: false,
        });
      }
    }

    merged.sort((a, b) => {
      // Available devices first
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });

    return merged;
  }

  getDevices(): UnifiedDevice[] {
    return this.unifiedDevices;
  }

  async connectToDevice(detail: {
    title: string;
    connectionType: "bluetooth" | "usb" | "";
    timestamp: number;
  }) {
    const connectionType = detail.connectionType;
    if (!connectionType) {
      return;
    }

    const connectedDevice = this.coreContext.getConnectedDevice();

    if (connectedDevice && connectedDevice.name === detail.title) {
      this.navigation.navigateTo(this.destinations.home);
      return;
    }

    // Navigate to connection status screen to show device animation
    this.navigation.navigateTo(this.destinations.deviceConnectionStatus);

    try {
      const device = await this.coreContext.connectToDevice(connectionType);

      // Save the connected device to known devices
      if (device) {
        this.saveDeviceToKnownList(device);
      }

      // Navigate based on pending transaction or to home
      const pendingTransactionParams =
        this.coreContext.getPendingTransactionParams();

      if (pendingTransactionParams) {
        this.navigation.navigateTo(this.destinations.signTransaction);
      } else {
        this.navigation.navigateTo(this.destinations.home);
      }
    } catch {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
    }
  }

  private saveDeviceToKnownList(device: {
    name: string;
    modelId: string;
    type: string;
  }) {
    const knownDevice = mapToKnownDeviceDbModel({
      name: device.name,
      modelId: device.modelId,
      type: device.type,
    });

    this.coreContext.saveKnownDevice(knownDevice);
  }

  async addNewDevice() {
    this.navigation.navigateTo(this.destinations.onboardingFlow);
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

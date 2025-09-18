import {
  ConnectedDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";

export class Device {
  constructor(private readonly _connectedDevice: ConnectedDevice) {}

  get name() {
    return this._connectedDevice.name;
  }

  get modelId() {
    return this._connectedDevice.modelId;
  }

  get sessionId() {
    return this._connectedDevice.sessionId;
  }

  get type() {
    return this._connectedDevice.type;
  }

  get iconType() {
    switch (this.modelId) {
      case DeviceModelId.NANO_X:
      case DeviceModelId.NANO_S:
      case DeviceModelId.NANO_SP:
        return "nanox";
      case DeviceModelId.STAX:
        return "stax";
      case DeviceModelId.FLEX:
      case DeviceModelId.APEX:
        return "flex";
    }
  }
}

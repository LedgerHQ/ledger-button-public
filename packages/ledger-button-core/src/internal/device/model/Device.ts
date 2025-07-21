import {
  ConnectedDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";

export type Device = Pick<ConnectedDevice, "name" | "sessionId" | "type"> & {
  modelId: "nanos" | "nanosp" | "nanox" | "stax" | "flex";
};

export function mapConnectedDeviceToDevice(device: ConnectedDevice): Device {
  const modelId =
    device.modelId === DeviceModelId.STAX
      ? "stax"
      : device.modelId === DeviceModelId.FLEX
        ? "flex"
        : device.modelId === DeviceModelId.NANO_X
          ? "nanox"
          : device.modelId === DeviceModelId.NANO_S
            ? "nanos"
            : device.modelId === DeviceModelId.NANO_SP
              ? "nanosp"
              : "stax";

  return {
    name: device.name,
    modelId,
    sessionId: device.sessionId,
    type: device.type,
  };
}

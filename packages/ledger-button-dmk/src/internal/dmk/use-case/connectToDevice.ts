import {
  DeviceManagementKit,
  DeviceSessionId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";

export async function connectToDevice({
  dmk,
  device,
}: {
  dmk: DeviceManagementKit;
  device: DiscoveredDevice;
}): Promise<DeviceSessionId> {
  const sessionId = await dmk.connect({ device });
  return sessionId;
}

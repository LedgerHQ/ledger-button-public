export type KnownDeviceDbModel = {
  id: string;
  name: string;
  modelId: string;
  type: string;
  firstConnectedAt: number;
  lastConnectedAt: number;
};

export function mapToKnownDeviceDbModel(device: {
  id?: string;
  name: string;
  modelId: string;
  type: string;
}): KnownDeviceDbModel {
  const now = Date.now();
  return {
    id: device.id ?? `${device.name}-${device.type}-${now}`,
    name: device.name,
    modelId: device.modelId,
    type: device.type,
    firstConnectedAt: now,
    lastConnectedAt: now,
  };
}

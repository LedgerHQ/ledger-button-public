import type { Translation } from "../context/constants/languages";

type DeviceModelCopy = Translation["common"]["device"]["model"];

/**
 * Localized display name for a device model, falling back to a generic name
 * when the model is unknown or absent.
 */
export function formatDeviceModelName(
  translation: Translation,
  modelId: string | undefined,
): string {
  const model = translation.common.device.model;
  if (!modelId) {
    return model.fallback;
  }
  return model[modelId as keyof DeviceModelCopy] ?? model.fallback;
}

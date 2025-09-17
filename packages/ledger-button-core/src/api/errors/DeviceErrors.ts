import { DeviceModelId } from "@ledgerhq/device-management-kit";

import { LedgerButtonError } from "./LedgerButtonError.js";

export class DeviceNotSupportedError extends LedgerButtonError<{
  modelId: DeviceModelId;
}> {
  constructor(message: string, context: { modelId: DeviceModelId }) {
    super(message, "DeviceNotSupportedError", context);
  }
}

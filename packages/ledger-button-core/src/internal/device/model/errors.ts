export {
  AccountNotSelectedError,
  DeviceConnectionError,
  type DeviceConnectionErrorType,
  FailToOpenAppError,
  SignTransactionError,
} from "../../../api/errors/DeviceFlowErrors.js";

import type {
  AccountNotSelectedError,
  DeviceConnectionError,
  SignTransactionError,
} from "../../../api/errors/DeviceFlowErrors.js";

export type DeviceServiceErrors =
  | DeviceConnectionError
  | SignTransactionError
  | AccountNotSelectedError;

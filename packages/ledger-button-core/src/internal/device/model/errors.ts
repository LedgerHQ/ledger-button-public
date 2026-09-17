export {
  AccountNotSelectedError,
  DeviceConnectionError,
  type DeviceConnectionErrorType,
  FailToOpenAppError,
  SignTransactionError,
} from "@api/errors/DeviceFlowErrors";

import type {
  AccountNotSelectedError,
  DeviceConnectionError,
  SignTransactionError,
} from "@api/errors/DeviceFlowErrors";

export type DeviceServiceErrors =
  | DeviceConnectionError
  | SignTransactionError
  | AccountNotSelectedError;

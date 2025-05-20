import { LedgerButtonDmk } from "src/api/LedgerButtonDmk.js";

import { connectToDevice } from "./use-case/connectToDevice.js";
import {
  discoverBleDevices,
  discoverHidDevices,
} from "./use-case/discoverDevices.js";
import { getDmk } from "./use-case/getDmk.js";

export const defaultLedgerButtonDmk: LedgerButtonDmk = {
  dmk: getDmk(),
  discoverHidDevices,
  discoverBleDevices,
  connectToDevice,
};

import { defaultLedgerButtonDmk } from "../internal/dmk/DefaultLedgerButtonDmk.js";

export function LedgerButtonDmkBuilder() {
  // NOTE: For now it returns the default implementation but we
  // can add configuration here if needed (only hid or ble for example)
  return defaultLedgerButtonDmk;
}

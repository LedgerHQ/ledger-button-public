import type { DeviceConfig } from "@ledgerhq/device-mockserver-client";

/** Flex fixture shared by the E2E suite and the manual mock setup. */
export const flex = {
  name: "Flex Test",
  device_type: "flex",
  connectivity_type: "BLE",
  firmware_version: "1.6.1",
  apps: [
    { name: "Ledger Sync", version: "1.3.0" },
    { name: "Ethereum", version: "1.22.5" },
    { name: "Solana", version: "1.17.1" },
  ],
} satisfies DeviceConfig & { name: string };

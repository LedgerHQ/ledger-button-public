import {
  type DeviceConfig,
  MockClient,
} from "@ledgerhq/device-mockserver-client";

export const MOCK_SERVER_URL =
  "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

const TEST_SEED =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const DEVICE_CONFIG: DeviceConfig = {
  device_type: "flex",
  connectivity_type: "BLE",
  firmware_version: "1.6.1",
  apps: [
    { name: "Ledger Sync", version: "1.3.0" },
    { name: "Ethereum", version: "1.22.5" },
    { name: "Solana", version: "1.17.1" },
  ],
};

const AUTO_APPROVE_POLL_INTERVAL_MS = 500;

const SKIP_TAP_MARKERS = [
  "use this app to sync",
  "ledger crypto accounts",
  "quit app",
  "connection cancelled",
];

const APPROVE_LABELS = [
  "connect",
  "approve",
  "allow",
  "confirm",
  "accept",
  "turn on sync",
  "enable",
];

type SpeculosEvent = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MockServerSession = {
  token: string;
  deviceId: string;
};

/**
 * Owns a Device Mock Server session with a single seeded Flex device, and can
 * auto-approve every confirmation prompt displayed on its Speculos screen.
 */
export class DeviceMockServer {
  private readonly client = new MockClient(MOCK_SERVER_URL);
  private autoApproveAbort: AbortController | null = null;
  private session: MockServerSession | null = null;

  async setUp(): Promise<MockServerSession> {
    const token = await this.client.authenticate();
    await this.overrideSeed(token);
    const device = await this.client.addDevice(DEVICE_CONFIG);

    this.session = { token, deviceId: device.id };
    console.log(`── DMS: session=${token.slice(0, 8)}… device=${device.id} ──`);
    return this.session;
  }

  startAutoApprover(): void {
    this.stopAutoApprover();
    this.autoApproveAbort = new AbortController();
    void this.autoApproveUntil(this.autoApproveAbort.signal);
  }

  stopAutoApprover(): void {
    this.autoApproveAbort?.abort();
    this.autoApproveAbort = null;
  }

  async tearDown(): Promise<void> {
    this.stopAutoApprover();
    try {
      await this.client.disconnectAll();
      await this.client.disposeSession();
    } catch (error) {
      console.warn("── DMS: teardown failed ──", error);
    }
    this.session = null;
  }

  getSession(): MockServerSession {
    if (!this.session) {
      throw new Error("DeviceMockServer.setUp() must be called first");
    }
    return this.session;
  }

  private async overrideSeed(token: string): Promise<void> {
    const response = await fetch(`${MOCK_SERVER_URL}/sessions/current/seed`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seed: TEST_SEED }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to set seed: ${response.status} ${await response.text()}`,
      );
    }
  }

  private async autoApproveUntil(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      try {
        await this.approveCurrentPrompt();
      } catch {
        // Speculos answers 409 until the DMK opens a session on the device.
      }
      await new Promise((resolve) =>
        setTimeout(resolve, AUTO_APPROVE_POLL_INTERVAL_MS),
      );
    }
  }

  private async approveCurrentPrompt(): Promise<void> {
    const { deviceId } = this.getSession();
    await this.client.getSpeculos(deviceId);

    const events = await this.fetchCurrentScreenEvents(deviceId);
    if (!events.length || this.isIdleScreen(events)) return;

    const approveElement = this.findApproveElement(events);
    const x = approveElement.x + Math.floor(approveElement.w / 2);
    const y = approveElement.y + Math.floor(approveElement.h / 2);
    await this.client.touchScreen(deviceId, x, y);
    console.log(`  [speculos] tapped "${approveElement.text}" @ (${x}, ${y})`);
  }

  private async fetchCurrentScreenEvents(
    deviceId: string,
  ): Promise<SpeculosEvent[]> {
    try {
      const response = await fetch(
        `${MOCK_SERVER_URL}/devices/${deviceId}/speculos/events?currentscreenonly=true`,
        { headers: { Authorization: `Bearer ${this.client.getToken()}` } },
      );
      if (!response.ok) return [];
      const body = (await response.json()) as { events?: SpeculosEvent[] };
      return body.events ?? [];
    } catch {
      return [];
    }
  }

  private isIdleScreen(events: SpeculosEvent[]): boolean {
    const screenText = events
      .map((event) => event.text)
      .join(" ")
      .toLowerCase();
    return SKIP_TAP_MARKERS.some((marker) => screenText.includes(marker));
  }

  /**
   * Prefers an exact label match, then the shortest substring match, and
   * falls back to the last element since action buttons sit at the bottom.
   */
  private findApproveElement(events: SpeculosEvent[]): SpeculosEvent {
    const normalize = (event: SpeculosEvent) => event.text.trim().toLowerCase();

    const exactMatch = events.find((event) =>
      APPROVE_LABELS.includes(normalize(event)),
    );
    const substringMatch = events
      .filter((event) =>
        APPROVE_LABELS.some((label) => normalize(event).includes(label)),
      )
      .sort((a, b) => a.text.length - b.text.length)[0];

    return exactMatch ?? substringMatch ?? events[events.length - 1];
  }
}

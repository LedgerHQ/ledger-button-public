import { injectable } from "inversify";

import type { EventRequest } from "@internal/backend/model/trackEvent";

import type { EventTrackingService } from "./EventTrackingService";

@injectable()
export class StubEventTrackingService implements EventTrackingService {
  getSessionId(): string {
    return "session-id-123";
  }

  async trackEvent(_event: EventRequest): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

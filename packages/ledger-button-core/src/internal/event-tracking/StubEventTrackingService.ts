import { injectable } from "inversify";

import type { EventRequest } from "../backend/types.js";
import type { EventTrackingService } from "./EventTrackingService.js";

@injectable()
export class StubEventTrackingService implements EventTrackingService {
  async trackEvent(event: EventRequest): Promise<void> {
    console.log("[Stub Event Tracking]", {
      type: event.type,
      name: event.name,
      eventId: event.data.event_id,
      timestamp: event.data.timestamp_ms,
    });

    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

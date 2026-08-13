import type { EventRequest } from "@internal/backend/model/trackEvent.js";

export interface EventTrackingService {
  getSessionId(): string;

  trackEvent(event: EventRequest): Promise<void>;
}

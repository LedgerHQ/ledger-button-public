import type { EventRequest } from "@internal/backend/model/trackEvent";

export interface EventTrackingService {
  getSessionId(): string;

  trackEvent(event: EventRequest): Promise<void>;
}

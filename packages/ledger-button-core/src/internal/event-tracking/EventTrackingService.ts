import type { EventRequest } from "../backend/types.js";

export interface EventTrackingService {
  trackEvent(event: EventRequest): Promise<void>;
}
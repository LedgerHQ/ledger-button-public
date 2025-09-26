import { injectable } from "inversify";
import { Observable } from "rxjs";

import type { EventRequest, EventResponse } from "../backend/types.js";

export interface EventTrackingService {
  trackEvent(event: EventRequest): Promise<void>;
}

@injectable()
export abstract class EventTrackingService {
  abstract trackEvent(event: EventRequest): Promise<void>;
}
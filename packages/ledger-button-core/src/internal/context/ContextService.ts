import { Observable } from "rxjs";

import type { ButtonCoreContext } from "@api/model/ButtonCoreContext.js";

import { type ContextEvent } from "./model/ContextEvent.js";

export interface ContextService {
  observeContext(): Observable<ButtonCoreContext>;
  getContext(): ButtonCoreContext;
  onEvent(event: ContextEvent): void;
}

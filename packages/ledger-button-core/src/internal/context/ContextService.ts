import { Observable } from "rxjs";

import type { ButtonCoreContext } from "@api/model/ButtonCoreContext";

import { type ContextEvent } from "./model/ContextEvent";

export interface ContextService {
  observeContext(): Observable<ButtonCoreContext>;
  getContext(): ButtonCoreContext;
  onEvent(event: ContextEvent): void;
}

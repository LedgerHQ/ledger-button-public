import { injectable } from "inversify";
import { Observable, Subject } from "rxjs";

import type { WalletNavigationIntent } from "../../blockchain-provider/model/types.js";

/**
 * Core -> UI bridge for {@link WalletNavigationIntent}s.
 *
 * Core emits an intent while running an account-selection / signing phase; the
 * button package subscribes via `LedgerButtonCore.observeNavigationIntents()`
 * and maps each intent to its own navigation. The `status$` / `finish` /
 * `retry` machinery lives on the intent itself.
 */
@injectable()
export class NavigationIntentService {
  private readonly intents$ = new Subject<WalletNavigationIntent>();

  observe(): Observable<WalletNavigationIntent> {
    return this.intents$.asObservable();
  }

  emit(intent: WalletNavigationIntent): void {
    this.intents$.next(intent);
  }
}

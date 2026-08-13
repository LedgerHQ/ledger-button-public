import { injectable } from "inversify";
import { map, type Observable } from "rxjs";

import type { AccountWithFiat } from "@api/model/Account.js";

@injectable()
export class SortAccountsByFiatUseCase {
  execute(accounts$: Observable<AccountWithFiat[]>): Observable<AccountWithFiat[]> {
    return accounts$.pipe(map((accounts) => this.sortByFiat(accounts)));
  }

  private sortByFiat(accounts: AccountWithFiat[]): AccountWithFiat[] {
    return [...accounts].sort((a, b) => {
      const aHydrated = a.fiatBalance !== undefined;
      const bHydrated = b.fiatBalance !== undefined;

      if (aHydrated && !bHydrated) return -1;
      if (!aHydrated && bHydrated) return 1;
      if (!aHydrated && !bHydrated) return 0;

      const aFiat = parseFloat(a.fiatBalance?.value ?? "0");
      const bFiat = parseFloat(b.fiatBalance?.value ?? "0");
      return bFiat - aFiat;
    });
  }
}

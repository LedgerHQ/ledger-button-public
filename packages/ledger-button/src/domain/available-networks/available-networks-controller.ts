import type {
  AccountWithFiat,
  FiatBalance,
  Network,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { lastValueFrom } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";

function computeAccountTotalFiat(account: AccountWithFiat): number {
  const nativeFiat = account.fiatBalance?.value
    ? parseFloat(account.fiatBalance.value)
    : 0;
  return account.tokens.reduce(
    (sum, token) =>
      sum + (token.fiatBalance?.value ? parseFloat(token.fiatBalance.value) : 0),
    nativeFiat,
  );
}

function aggregateNetworksFromAccounts(accounts: AccountWithFiat[]): Network[] {
  const networkMap = accounts.reduce<
    Map<string, { totalFiat: number; currency: string }>
  >((acc, account) => {
    const existing = acc.get(account.currencyId);
    const accountFiat = computeAccountTotalFiat(account);
    const currency = account.fiatBalance?.currency ?? "USD";
    return acc.set(account.currencyId, {
      totalFiat: (existing?.totalFiat ?? 0) + accountFiat,
      currency: existing?.currency ?? currency,
    });
  }, new Map());

  return Array.from(networkMap.entries())
    .sort((a, b) => b[1].totalFiat - a[1].totalFiat)
    .map(([currencyId, { totalFiat, currency }]): Network => ({
      id: currencyId,
      name: currencyId,
      fiatBalance:
        totalFiat > 0
          ? ({ value: totalFiat.toFixed(2), currency } as FiatBalance)
          : undefined,
    }));
}

export class AvailableNetworksController implements ReactiveController {
  networks: Network[] = [];
  loading = true;
  private disconnected = false;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.disconnected = false;
    this.fetchNetworks();
  }

  hostDisconnected() {
    this.disconnected = true;
  }

  private async fetchNetworks() {
    this.loading = true;
    this.host.requestUpdate();

    try {
      const accounts = await lastValueFrom(this.core.getAccounts("usd"));

      if (this.disconnected) return;

      if (!accounts.length) {
        this.navigation.navigateBack();
        return;
      }

      this.networks = aggregateNetworksFromAccounts(accounts);
    } catch {
      if (this.disconnected) return;
      this.navigation.navigateBack();
    } finally {
      if (!this.disconnected) {
        this.loading = false;
        this.host.requestUpdate();
      }
    }
  }
}

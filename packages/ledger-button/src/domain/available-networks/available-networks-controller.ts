import type {
  AccountWithFiat,
  FiatBalance,
  Network,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { firstValueFrom, lastValueFrom } from "rxjs";

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

async function aggregateNetworksFromAccounts(
  accounts: AccountWithFiat[],
  selectedAddress: string,
  core: CoreContext,
): Promise<Network[]> {
  const matching = accounts.filter(
    (a) => a.freshAddress === selectedAddress,
  );

  const networks = await Promise.all(
    matching.map(async (account): Promise<Network> => {
      const totalFiat = computeAccountTotalFiat(account);
      const currency = account.fiatBalance?.currency ?? "USD";
      const { name, ticker } = await core.getCurrencyInfo(account.currencyId);
      return {
        id: account.currencyId,
        name,
        ticker,
        fiatBalance:
          totalFiat > 0
            ? ({ value: totalFiat.toFixed(2), currency } as FiatBalance)
            : undefined,
      };
    }),
  );

  return networks.sort((a, b) => {
    const aVal = a.fiatBalance?.value ? parseFloat(a.fiatBalance.value) : 0;
    const bVal = b.fiatBalance?.value ? parseFloat(b.fiatBalance.value) : 0;
    return bVal - aVal;
  });
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
      const currentContext = await firstValueFrom(this.core.observeContext());
      const selectedAddress = currentContext.selectedAccount?.freshAddress;

      if (!selectedAddress) {
        this.navigation.navigateBack();
        return;
      }

      const accounts = await lastValueFrom(this.core.getAccounts("usd"));

      if (this.disconnected) return;

      if (!accounts.length) {
        this.navigation.navigateBack();
        return;
      }

      this.networks = await aggregateNetworksFromAccounts(
        accounts,
        selectedAddress,
        this.core,
      );
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

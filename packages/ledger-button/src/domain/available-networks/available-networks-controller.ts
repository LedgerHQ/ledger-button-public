import "../../shared/root-navigation.js";

import type {
  Account,
  AccountWithFiat,
  Network,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { firstValueFrom, Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";

export interface NetworkWithBalance extends Network {
  balance?: string;
}

export class AvailableNetworksController implements ReactiveController {
  networks: NetworkWithBalance[] = [];
  loading = true;
  balanceLoading = true;
  private disconnected = false;
  private accountsSubscription?: Subscription;
  private accountsByNetwork = new Map<string, Account>();
  private selectedAddress?: string;
  private latestMatchingAccounts: AccountWithFiat[] = [];

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.disconnected = false;
    this.loadNetworks();
  }

  hostDisconnected() {
    this.disconnected = true;
    this.accountsSubscription?.unsubscribe();
    this.accountsSubscription = undefined;
  }

  private async loadNetworks() {
    this.loading = true;
    this.balanceLoading = true;
    this.host.requestUpdate();

    try {
      const currentContext = await firstValueFrom(this.core.observeContext());
      this.selectedAddress =
        currentContext.selectedAccounts.get("ethereum")?.freshAddress;

      if (!this.selectedAddress) {
        this.navigation.navigateBack();
        return;
      }

      this.accountsSubscription = this.core.observeAccounts().subscribe({
        next: (accounts) => {
          if (this.disconnected) return;

          const matching = accounts.filter(
            (a) => a.freshAddress === this.selectedAddress,
          );

          if (matching.length) {
            this.latestMatchingAccounts = matching;
            matching.forEach((a) =>
              this.accountsByNetwork.set(a.currencyId, a),
            );
            void this.finalizeNetworks();
          }
        },
        error: () => {
          if (this.disconnected) return;
          this.balanceLoading = false;
          this.loading = false;
          this.host.requestUpdate();
        },
      });
    } catch {
      if (this.disconnected) return;
      this.navigation.navigateBack();
    }
  }

  private async finalizeNetworks() {
    await this.updateNetworksFromAccounts(this.latestMatchingAccounts);
    this.balanceLoading = false;
    this.loading = false;
    this.host.requestUpdate();
  }

  private async updateNetworksFromAccounts(accounts: AccountWithFiat[]) {
    const networks = await Promise.all(
      accounts.map(async (account): Promise<NetworkWithBalance> => {
        const { name, ticker } = await this.core.getCurrencyInfo(
          account.currencyId,
        );

        return {
          id: account.currencyId,
          name,
          ticker,
          balance: account.balance,
          fiatBalance: account.fiatBalance,
        };
      }),
    );

    if (this.disconnected) return;

    this.networks = this.sortByFiatValue(networks);
  }

  selectNetwork(networkId: string) {
    const account = this.accountsByNetwork.get(networkId);
    if (!account) return;

    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.selectAccount(account);
      this.navigation.host.navigateToHome();
      this.host.requestUpdate();
    }
  }

  private sortByFiatValue(
    networks: NetworkWithBalance[],
  ): NetworkWithBalance[] {
    return [...networks].sort((a, b) => {
      const aVal = a.fiatBalance?.value ? parseFloat(a.fiatBalance.value) : 0;
      const bVal = b.fiatBalance?.value ? parseFloat(b.fiatBalance.value) : 0;
      return bVal - aVal;
    });
  }
}

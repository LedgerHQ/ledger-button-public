import {
  NoAccountInSyncError,
  NoCompatibleAccountsError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { type ReactiveController, type ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";
import { LanguageContext } from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
import { type Destinations } from "../../../shared/routes.js";

export class RetrievingAccountsController implements ReactiveController {
  errorData?: {
    message: string;
    title: string;
    cta1?: { label: string; action: () => void };
    cta2?: { label: string; action: () => void };
  } = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
    private readonly lang: LanguageContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.fetchAccounts();
    this.host.requestUpdate();
  }

  async fetchAccounts() {
    try {
      const accounts = await this.core.fetchAccountsFromCloudSync();
      this.host.requestUpdate();

      if (!accounts || accounts.length === 0) {
        this.navigation.navigateTo(this.destinations.turnOnSync);
        return;
      }

      this.navigation.navigateTo(this.destinations.selectAccount);
    } catch (error) {
      console.error(error);
      this.mapError(error);
      this.host.requestUpdate();
    }
  }

  mapError(error: unknown) {
    switch (true) {
      case error instanceof NoCompatibleAccountsError: {
        const networks =
          error.context && error.context.networks.length > 1
            ? `${error.context.networks.slice(0, -1).join(", ")} and ${error.context.networks.slice(-1)[0]}`
            : "";

        this.errorData = {
          title:
            this.lang.currentTranslation.error.ledgerSync.NoCompatibleAccounts
              .title,
          message:
            this.lang.currentTranslation.error.ledgerSync.NoCompatibleAccounts.description.replace(
              "{networks}",
              networks,
            ),
          cta1: {
            label:
              this.lang.currentTranslation.error.ledgerSync.NoCompatibleAccounts
                .cta1,
            action: () => {
              // TODO: handle deeplink
              this.errorData = undefined;
              window.open("ledgerlive://accounts");
              if (this.navigation.host instanceof RootNavigationComponent) {
                this.navigation.host.closeModal();
              }
            },
          },
          cta2: {
            label:
              this.lang.currentTranslation.error.ledgerSync.NoCompatibleAccounts
                .cta2,
            action: () => {
              this.errorData = undefined;
              this.navigation.navigateTo(this.destinations.onboarding);
            },
          },
        };
        break;
      }
      case error instanceof NoAccountInSyncError: {
        this.errorData = {
          title:
            this.lang.currentTranslation.error.ledgerSync.NoAccountInSync.title,
          message:
            this.lang.currentTranslation.error.ledgerSync.NoAccountInSync
              .description,
          cta1: {
            label:
              this.lang.currentTranslation.error.ledgerSync.NoAccountInSync
                .cta1,
            action: () => {
              if (this.navigation.host instanceof RootNavigationComponent) {
                this.navigation.host.closeModal();
              }
            },
          },
        };
        break;
      }
      default:
        this.errorData = {
          title: this.lang.currentTranslation.error.generic.account.title,
          message:
            this.lang.currentTranslation.error.generic.account.description,
          cta1: {
            label: this.lang.currentTranslation.error.generic.account.cta1,
            action: () => {
              this.errorData = undefined;
              this.host.requestUpdate();
              this.fetchAccounts();
            },
          },
        };
        break;
    }
  }
}

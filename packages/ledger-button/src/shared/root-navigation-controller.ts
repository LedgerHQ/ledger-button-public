import {
  Account,
  type BlockchainFamily,
  Device,
  type SelectAccountNavigationIntent,
  type WalletNavigationIntent,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController } from "lit";
import { Subscription } from "rxjs";

import type { DeviceModelId } from "../components/atom/icon/device-icon/device-icon.js";
import { CoreContext } from "../context/core-context.js";
import { LanguageContext } from "../context/language-context.js";
import { Navigation, NavigationHost } from "./navigation.js";
import {
  Destination,
  Destinations,
  makeDestinations,
  resolveCanGoBack,
} from "./routes.js";

/**
 * Routing payload that scopes the account picker to one blockchain family. It
 * is either a core `selectAccount` intent or, when the picker is opened from
 * the home panel, an equivalent payload built locally - hence only the routing
 * fields, without the sign-flow machinery.
 */
export type SelectAccountNavigationParams = Pick<
  SelectAccountNavigationIntent,
  "name" | "params"
>;

/** Anything that can drive `navigationIntent`. */
export type NavigationIntentParams =
  | WalletNavigationIntent
  | SelectAccountNavigationParams;

export type RootNavigationUiModel = {
  title: string | undefined;
  subtitle: string | undefined;
  canGoBack: boolean;
  canClose: boolean;
  showSettings: boolean;
  showLogo: boolean;
  deviceModelId: DeviceModelId | undefined;
};

export class RootNavigationController implements ReactiveController {
  navigation: Navigation;
  isModalOpen = false;
  destinations: Destinations;
  params?: unknown;

  private hasTrackingConsent?: boolean;
  private welcomeScreenCompleted = false;
  private contextSubscription?: Subscription;
  private readonly onLanguageChange = () => {
    this.host.requestUpdate();
  };
  connectedDevice: Device | undefined;

  constructor(
    private readonly host: NavigationHost,
    private readonly core: CoreContext,
    private readonly languages: LanguageContext,
    private readonly modalContent: HTMLElement,
  ) {
    this.host.addController(this);
    this.navigation = new Navigation(host, this.modalContent);
    this.destinations = makeDestinations(this.languages);
  }

  hostConnected() {
    this.languages.addEventListener(
      LanguageContext.LANGUAGE_CHANGE,
      this.onLanguageChange,
    );
    this.computeInitialState();
    this.contextSubscription = this.core
      .observeContext()
      .subscribe((context) => {
        this.hasTrackingConsent = context.hasTrackingConsent;
        this.welcomeScreenCompleted = context.welcomeScreenCompleted;
        this.connectedDevice = context.connectedDevice;
        this.host.requestUpdate();
      });
  }

  hostDisconnected() {
    this.contextSubscription?.unsubscribe();
    this.languages.removeEventListener(
      LanguageContext.LANGUAGE_CHANGE,
      this.onLanguageChange,
    );
  }

  get currentScreen() {
    return this.navigation.currentScreen;
  }

  get rootNavigationUiModel(): RootNavigationUiModel {
    const connectedDevice = this.connectedDevice;
    const canGoBack = resolveCanGoBack(
      this.currentScreen?.canGoBack,
      this.core,
    );

    const canClose = this.currentScreen?.toolbar.canClose ?? true;

    const isHomeFlow = this.currentScreen?.name === "home-flow";
    const isOnboardingFlow = this.currentScreen?.name === "onboarding-flow";

    const isOnConsentScreen =
      (isHomeFlow || isOnboardingFlow) &&
      this.welcomeScreenCompleted &&
      this.hasTrackingConsent === undefined;

    const shouldShowDeviceChip = isHomeFlow && !isOnConsentScreen;

    const title = this.resolveTitle({
      connectedDevice,
      shouldShowDeviceChip,
      isOnConsentScreen,
      isOnboardingFlow,
    });

    const deviceModelId =
      connectedDevice && shouldShowDeviceChip
        ? connectedDevice.modelId
        : undefined;

    const showSettings = this.currentScreen?.name === "home-flow";
    const showLogo = this.currentScreen?.toolbar.showLogo !== false;

    const uiModel: RootNavigationUiModel = {
      title,
      subtitle: this.currentScreen?.toolbar.subtitle,
      canGoBack,
      canClose,
      showSettings,
      showLogo,
      deviceModelId,
    };

    return uiModel;
  }

  async computeInitialState(family?: BlockchainFamily) {
    // For a family-specific request, only that family's account counts as
    // "already connected"; otherwise fall back to the active selection.
    const selectedAccount = family
      ? this.core.getSelectedAccount(family)
      : await this.core.getActiveSelectedAccount();

    if (!selectedAccount) {
      this.navigation.navigateTo(this.onboardingDestination);
      return;
    } else {
      this.navigation.navigateTo(this.destinations.home);
      return;
    }
  }

  private get onboardingDestination(): Destination {
    return this.core.isMobile()
      ? this.destinations.mobileOnboarding
      : this.destinations.onboardingFlow;
  }

  private resolveTitle({
    connectedDevice,
    shouldShowDeviceChip,
    isOnConsentScreen,
    isOnboardingFlow,
  }: {
    connectedDevice: Device | undefined;
    shouldShowDeviceChip: boolean;
    isOnConsentScreen: boolean;
    isOnboardingFlow: boolean;
  }): string | undefined {
    if (connectedDevice && shouldShowDeviceChip) {
      return connectedDevice.name;
    }

    if (isOnConsentScreen) {
      return this.destinations.consentAnalytics.toolbar.title;
    }

    if (isOnboardingFlow && !this.welcomeScreenCompleted) {
      return "";
    }

    return this.currentScreen?.toolbar.title;
  }

  /**
   * Extract the target blockchain family from a navigation intent, when the
   * intent is a family-specific connection request emitted by core. Returns
   * `undefined` for generic entry points (e.g. the floating button).
   */
  private resolveRequestedFamily(
    intent?: NavigationIntentParams,
  ): BlockchainFamily | undefined {
    return intent?.name === "selectAccount" ? intent.params.family : undefined;
  }

  // NOTE: First Draft of navigationIntent
  // Could be moved to a separate file/controller (maybe navigation ?)
  navigationIntent(
    route: Destination["name"],
    params?: NavigationIntentParams,
  ) {
    this.params = params ?? undefined;

    switch (route) {
      case "selectAccount": {
        // A family-specific request (e.g. an EVM `eth_requestAccounts` while
        // only Solana is connected) must be able to reach the account picker
        // even though another family already has a selected account. Only a
        // generic entry point (floating button, no family) short-circuits to
        // home when any account is connected.
        const requestedFamily = this.resolveRequestedFamily(params);
        const alreadyConnected = requestedFamily
          ? this.core.getSelectedAccount(requestedFamily)
          : this.core.getActiveSelectedAccount();

        if (alreadyConnected) {
          this.navigation.navigateTo(this.destinations.home);
          break;
        }

        this.computeInitialState(requestedFamily);
        break;
      }

      case "home": {
        if (!this.core.getActiveSelectedAccount()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.home);
        break;
      }

      case "turnOnSync":
        this.navigation.navigateTo(this.destinations.turnOnSync);
        break;

      case "signTransaction": {
        if (!this.core.getActiveSelectedAccount()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.signingFlow);
        break;
      }

      case "deviceSwitch": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.deviceSwitch);
        break;
      }
      case "fetchAccounts": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.fetchAccounts);
        break;
      }
      case "deviceConnectionStatus": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.deviceConnectionStatus);
        break;
      }
      case "ledgerSync": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.navigation.navigateTo(this.destinations.ledgerSync);
        break;
      }

      case "onboarding":
        this.navigation.navigateTo(this.onboardingDestination);
        break;

      case "settings":
        this.navigation.navigateTo(this.destinations.settings);
        break;

      case "availableNetworks":
        this.navigation.navigateTo(this.destinations.availableNetworks);
        break;

      case "preferences":
        this.navigation.navigateTo(this.destinations.preferences);
        break;

      case "security":
        this.navigation.navigateTo(this.destinations.security);
        break;

      case "support":
        this.navigation.navigateTo(this.destinations.support);
        break;

      case "notFound":
      default:
        this.navigation.navigateTo(this.destinations.notFound);
        break;
    }
  }

  async handleModalOpen() {
    if (!this.currentScreen) {
      await this.computeInitialState();
      return;
    }

    this.navigation.navigateTo(this.currentScreen);
  }

  async handleModalClose() {
    this.navigation.resetNavigation();
  }

  async handleChipClick() {
    this.navigation.navigateTo(this.destinations.deviceSwitch);
  }

  navigateToSettings() {
    this.navigation.navigateTo(this.destinations.settings);
  }

  /**
   * Open the account picker from the home panel. Unlike a dApp-driven request
   * this is a manual entry point, but the picker must still be scoped to the
   * family the user is currently viewing (e.g. only Solana accounts while on
   * the Solana tab). We therefore carry the active family in the navigation
   * params so `select-account-screen` filters the list accordingly.
   */
  switchAccount() {
    const family = this.core.getActiveFamily();
    const params: SelectAccountNavigationParams | undefined = family
      ? { name: "selectAccount", params: { family } }
      : undefined;
    this.params = params;
    this.navigation.navigateTo(this.destinations.fetchAccounts);
  }

  selectAccount(account: Account) {
    this.core.selectAccount(account);
    this.host.requestUpdate();
  }

  navigateBack() {
    this.navigation.navigateBack();
  }

  get selectedAccount() {
    return this.core.getActiveSelectedAccount();
  }
}

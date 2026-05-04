import {
  Account,
  Device,
  SignTransactionParams,
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

export type RootNavigationUiModel = {
  title: string | undefined;
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
      canGoBack,
      canClose,
      showSettings,
      showLogo,
      deviceModelId,
    };

    return uiModel;
  }

  async computeInitialState() {
    const selectedAccount = await this.core.getSelectedAccount();

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

  // NOTE: First Draft of navigationIntent
  // Could be moved to a separate file/controller (maybe navigation ?)
  navigationIntent(route: Destination["name"], params: unknown) {
    this.params = params ?? undefined;

    switch (route) {
      case "selectAccount": {
        if (this.core.getSelectedAccount()) {
          this.navigation.navigateTo(this.destinations.home);
          break;
        }

        this.computeInitialState();
        break;
      }

      case "home": {
        if (!this.core.getSelectedAccount()) {
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
        if (!this.core.getSelectedAccount()) {
          this.navigation.navigateTo(this.onboardingDestination);
          break;
        }

        this.core.setCraftedTransactionParams(params as SignTransactionParams);
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

  selectAccount(account: Account) {
    this.core.selectAccount(account);
    this.host.requestUpdate();
  }

  navigateBack() {
    this.navigation.navigateBack();
  }

  get selectedAccount() {
    return this.core.getSelectedAccount();
  }
}

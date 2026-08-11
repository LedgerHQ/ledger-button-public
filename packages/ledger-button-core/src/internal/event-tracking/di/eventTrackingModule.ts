import { ContainerModule } from "inversify";

import { DefaultEventTrackingService } from "../service/DefaultEventTrackingService.js";
import { EventTrackingService } from "../service/EventTrackingService.js";
import { StubEventTrackingService } from "../service/StubEventTrackingService.js";
import { TrackConsentGiven } from "../use-case/TrackConsentGiven.js";
import { TrackConsentRemoved } from "../use-case/TrackConsentRemoved.js";
import { TrackCurrencyChanged } from "../use-case/TrackCurrencyChanged.js";
import { TrackFloatingButtonClick } from "../use-case/TrackFloatingButtonClick.js";
import { TrackLanguageChanged } from "../use-case/TrackLanguageChanged.js";
import { TrackLedgerSyncActivated } from "../use-case/TrackLedgerSyncActivated.js";
import { TrackLedgerSyncOpened } from "../use-case/TrackLedgerSyncOpened.js";
import { TrackMobileRedirectLedgerWallet } from "../use-case/TrackMobileRedirectLedgerWallet.js";
import { TrackOnboarding } from "../use-case/TrackOnboarding.js";
import { TrackOpenSession } from "../use-case/TrackOpenSession.js";
import { TrackTransactionCompleted } from "../use-case/TrackTransactionCompleted.js";
import { TrackTransactionStarted } from "../use-case/TrackTransactionStarted.js";
import { TrackTypedMessageCompleted } from "../use-case/TrackTypedMessageCompleted.js";
import { TrackTypedMessageStarted } from "../use-case/TrackTypedMessageStarted.js";
import { TrackViewAllTransactions } from "../use-case/TrackViewAllTransactions.js";
import { TrackViewTransactionDetailsClick } from "../use-case/TrackViewTransactionDetailsClick.js";
import { TrackWalletAction } from "../use-case/TrackWalletAction.js";
import { eventTrackingModuleTypes } from "./eventTrackingModuleTypes.js";

interface EventTrackingModuleFactoryOptions {
  stub?: boolean;
}

export const eventTrackingModuleFactory = ({
  stub = false,
}: EventTrackingModuleFactoryOptions = {}) => {
  return new ContainerModule(({ bind }) => {
    if (stub) {
      bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
        .to(StubEventTrackingService)
        .inSingletonScope();

      return;
    }

    bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
      .to(DefaultEventTrackingService)
      .inSingletonScope();

    bind<TrackConsentGiven>(eventTrackingModuleTypes.TrackConsentGiven).to(
      TrackConsentGiven,
    );

    bind<TrackConsentRemoved>(eventTrackingModuleTypes.TrackConsentRemoved).to(
      TrackConsentRemoved,
    );

    bind<TrackLanguageChanged>(
      eventTrackingModuleTypes.TrackLanguageChanged,
    ).to(TrackLanguageChanged);

    bind<TrackCurrencyChanged>(
      eventTrackingModuleTypes.TrackCurrencyChanged,
    ).to(TrackCurrencyChanged);

    bind<TrackFloatingButtonClick>(
      eventTrackingModuleTypes.TrackFloatingButtonClick,
    ).to(TrackFloatingButtonClick);

    bind<TrackOnboarding>(eventTrackingModuleTypes.TrackOnboarding).to(
      TrackOnboarding,
    );

    bind<TrackTransactionStarted>(
      eventTrackingModuleTypes.TrackTransactionStarted,
    ).to(TrackTransactionStarted);

    bind<TrackTransactionCompleted>(
      eventTrackingModuleTypes.TrackTransactionCompleted,
    ).to(TrackTransactionCompleted);

    bind<TrackLedgerSyncOpened>(
      eventTrackingModuleTypes.TrackLedgerSyncOpened,
    ).to(TrackLedgerSyncOpened);

    bind<TrackOpenSession>(eventTrackingModuleTypes.TrackOpenSession).to(
      TrackOpenSession,
    );

    bind<TrackLedgerSyncActivated>(
      eventTrackingModuleTypes.TrackLedgerSyncActivated,
    ).to(TrackLedgerSyncActivated);

    bind<TrackTypedMessageStarted>(
      eventTrackingModuleTypes.TrackTypedMessageStarted,
    ).to(TrackTypedMessageStarted);

    bind<TrackTypedMessageCompleted>(
      eventTrackingModuleTypes.TrackTypedMessageCompleted,
    ).to(TrackTypedMessageCompleted);

    bind<TrackWalletAction>(eventTrackingModuleTypes.TrackWalletAction).to(
      TrackWalletAction,
    );

    bind<TrackMobileRedirectLedgerWallet>(
      eventTrackingModuleTypes.TrackMobileRedirectLedgerWallet,
    ).to(TrackMobileRedirectLedgerWallet);

    bind<TrackViewTransactionDetailsClick>(
      eventTrackingModuleTypes.TrackViewTransactionDetailsClick,
    ).to(TrackViewTransactionDetailsClick);

    bind<TrackViewAllTransactions>(
      eventTrackingModuleTypes.TrackViewAllTransactions,
    ).to(TrackViewAllTransactions);
  });
};

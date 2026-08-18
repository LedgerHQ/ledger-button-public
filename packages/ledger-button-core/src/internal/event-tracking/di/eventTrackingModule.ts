import { ContainerModule } from "inversify";

import { DefaultEventTrackingService } from "../service/DefaultEventTrackingService";
import { EventTrackingService } from "../service/EventTrackingService";
import { StubEventTrackingService } from "../service/StubEventTrackingService";
import { TrackConsentGiven } from "../use-case/TrackConsentGiven";
import { TrackConsentRemoved } from "../use-case/TrackConsentRemoved";
import { TrackCurrencyChanged } from "../use-case/TrackCurrencyChanged";
import { TrackFloatingButtonClick } from "../use-case/TrackFloatingButtonClick";
import { TrackLanguageChanged } from "../use-case/TrackLanguageChanged";
import { TrackLedgerSyncActivated } from "../use-case/TrackLedgerSyncActivated";
import { TrackLedgerSyncOpened } from "../use-case/TrackLedgerSyncOpened";
import { TrackMobileRedirectLedgerWallet } from "../use-case/TrackMobileRedirectLedgerWallet";
import { TrackOnboarding } from "../use-case/TrackOnboarding";
import { TrackOpenSession } from "../use-case/TrackOpenSession";
import { TrackTransactionCompleted } from "../use-case/TrackTransactionCompleted";
import { TrackTransactionStarted } from "../use-case/TrackTransactionStarted";
import { TrackTypedMessageCompleted } from "../use-case/TrackTypedMessageCompleted";
import { TrackTypedMessageStarted } from "../use-case/TrackTypedMessageStarted";
import { TrackViewAllTransactions } from "../use-case/TrackViewAllTransactions";
import { TrackViewTransactionDetailsClick } from "../use-case/TrackViewTransactionDetailsClick";
import { TrackWalletAction } from "../use-case/TrackWalletAction";
import { eventTrackingModuleTypes } from "./eventTrackingModuleTypes";

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

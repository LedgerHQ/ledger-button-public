import { ContainerModule } from "inversify";

import { DefaultEventTrackingService } from "../service/DefaultEventTrackingService";
import { EventTrackingService } from "../service/EventTrackingService";
import { StubEventTrackingService } from "../service/StubEventTrackingService";
import { TrackConsentGivenUseCase } from "../use-case/TrackConsentGivenUseCase";
import { TrackConsentRemovedUseCase } from "../use-case/TrackConsentRemovedUseCase";
import { TrackCurrencyChangedUseCase } from "../use-case/TrackCurrencyChangedUseCase";
import { TrackFloatingButtonClickUseCase } from "../use-case/TrackFloatingButtonClickUseCase";
import { TrackLanguageChangedUseCase } from "../use-case/TrackLanguageChangedUseCase";
import { TrackLedgerSyncActivatedUseCase } from "../use-case/TrackLedgerSyncActivatedUseCase";
import { TrackLedgerSyncOpenedUseCase } from "../use-case/TrackLedgerSyncOpenedUseCase";
import { TrackMobileRedirectLedgerWalletUseCase } from "../use-case/TrackMobileRedirectLedgerWalletUseCase";
import { TrackOnboardingUseCase } from "../use-case/TrackOnboardingUseCase";
import { TrackOpenSessionUseCase } from "../use-case/TrackOpenSessionUseCase";
import { TrackTransactionCompletedUseCase } from "../use-case/TrackTransactionCompletedUseCase";
import { TrackTransactionStartedUseCase } from "../use-case/TrackTransactionStartedUseCase";
import { TrackTypedMessageCompletedUseCase } from "../use-case/TrackTypedMessageCompletedUseCase";
import { TrackTypedMessageStartedUseCase } from "../use-case/TrackTypedMessageStartedUseCase";
import { TrackViewAllTransactions } from "../use-case/TrackViewAllTransactions";
import { TrackViewTransactionDetailsClickUseCase } from "../use-case/TrackViewTransactionDetailsClickUseCase";
import { TrackWalletAction } from "../use-case/TrackWalletAction";
import { eventTrackingModuleTypes } from "./eventTrackingModuleTypes";

interface EventTrackingModuleFactoryOptions {
  stub?: boolean;
}

export const eventTrackingModuleFactory = ({
  stub = false,
}: EventTrackingModuleFactoryOptions = {}) => {
  return new ContainerModule(({ bind }) => {
    // Only the service implementation varies between stub and real mode.
    // All use cases are always bound because non-stubbed services (e.g.
    // ModalService) inject them directly — leaving them unbound in stub mode
    // causes an Inversify "no bindings found" error even when tracking is off.
    if (stub) {
      bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
        .to(StubEventTrackingService)
        .inSingletonScope();
    } else {
      bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
        .to(DefaultEventTrackingService)
        .inSingletonScope();
    }

    bind<TrackConsentGivenUseCase>(eventTrackingModuleTypes.TrackConsentGivenUseCase).to(
      TrackConsentGivenUseCase,
    );

    bind<TrackConsentRemovedUseCase>(eventTrackingModuleTypes.TrackConsentRemovedUseCase).to(
      TrackConsentRemovedUseCase,
    );

    bind<TrackLanguageChangedUseCase>(
      eventTrackingModuleTypes.TrackLanguageChangedUseCase,
    ).to(TrackLanguageChangedUseCase);

    bind<TrackCurrencyChangedUseCase>(
      eventTrackingModuleTypes.TrackCurrencyChangedUseCase,
    ).to(TrackCurrencyChangedUseCase);

    bind<TrackFloatingButtonClickUseCase>(
      eventTrackingModuleTypes.TrackFloatingButtonClickUseCase,
    ).to(TrackFloatingButtonClickUseCase);

    bind<TrackOnboardingUseCase>(eventTrackingModuleTypes.TrackOnboardingUseCase).to(
      TrackOnboardingUseCase,
    );

    bind<TrackTransactionStartedUseCase>(
      eventTrackingModuleTypes.TrackTransactionStartedUseCase,
    ).to(TrackTransactionStartedUseCase);

    bind<TrackTransactionCompletedUseCase>(
      eventTrackingModuleTypes.TrackTransactionCompletedUseCase,
    ).to(TrackTransactionCompletedUseCase);

    bind<TrackLedgerSyncOpenedUseCase>(
      eventTrackingModuleTypes.TrackLedgerSyncOpenedUseCase,
    ).to(TrackLedgerSyncOpenedUseCase);

    bind<TrackOpenSessionUseCase>(eventTrackingModuleTypes.TrackOpenSessionUseCase).to(
      TrackOpenSessionUseCase,
    );

    bind<TrackLedgerSyncActivatedUseCase>(
      eventTrackingModuleTypes.TrackLedgerSyncActivatedUseCase,
    ).to(TrackLedgerSyncActivatedUseCase);

    bind<TrackTypedMessageStartedUseCase>(
      eventTrackingModuleTypes.TrackTypedMessageStartedUseCase,
    ).to(TrackTypedMessageStartedUseCase);

    bind<TrackTypedMessageCompletedUseCase>(
      eventTrackingModuleTypes.TrackTypedMessageCompletedUseCase,
    ).to(TrackTypedMessageCompletedUseCase);

    bind<TrackWalletAction>(eventTrackingModuleTypes.TrackWalletAction).to(
      TrackWalletAction,
    );

    bind<TrackMobileRedirectLedgerWalletUseCase>(
      eventTrackingModuleTypes.TrackMobileRedirectLedgerWalletUseCase,
    ).to(TrackMobileRedirectLedgerWalletUseCase);

    bind<TrackViewTransactionDetailsClickUseCase>(
      eventTrackingModuleTypes.TrackViewTransactionDetailsClickUseCase,
    ).to(TrackViewTransactionDetailsClickUseCase);

    bind<TrackViewAllTransactions>(
      eventTrackingModuleTypes.TrackViewAllTransactions,
    ).to(TrackViewAllTransactions);
  });
};

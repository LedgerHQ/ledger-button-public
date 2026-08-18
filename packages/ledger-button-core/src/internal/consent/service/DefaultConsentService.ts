import { inject, injectable } from "inversify";

import { eventTrackingModuleTypes } from "@internal/event-tracking/di/eventTrackingModuleTypes";
import type { TrackConsentGiven } from "@internal/event-tracking/use-case/TrackConsentGiven";
import type { TrackConsentRemoved } from "@internal/event-tracking/use-case/TrackConsentRemoved";
import { storageModuleTypes } from "@internal/storage/di/storageModuleTypes";
import type { UserConsent } from "@internal/storage/model/UserConsent";
import type { StorageService } from "@internal/storage/StorageService";

import type { ConsentService } from "./ConsentService";

@injectable()
export class DefaultConsentService implements ConsentService {
  constructor(
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(eventTrackingModuleTypes.TrackConsentGiven)
    private readonly trackConsentGiven: TrackConsentGiven,
    @inject(eventTrackingModuleTypes.TrackConsentRemoved)
    private readonly trackConsentRemoved: TrackConsentRemoved,
  ) {}

  async hasConsent(): Promise<boolean> {
    const consent = await this.storageService.getUserConsent();
    return consent.map((c) => c.consentGiven).orDefault(false);
  }

  async hasRespondedToConsent(): Promise<boolean> {
    const consent = await this.storageService.getUserConsent();
    return consent.isJust();
  }

  async giveConsent(): Promise<void> {
    const consent: UserConsent = {
      consentGiven: true,
      consentDate: new Date().toISOString(),
    };

    await this.storageService.saveUserConsent(consent);

    await this.trackConsentGiven.execute();
  }

  async refuseConsent(): Promise<void> {
    const consent: UserConsent = {
      consentGiven: false,
      consentDate: new Date().toISOString(),
    };

    await this.storageService.saveUserConsent(consent);
  }

  async removeConsent(): Promise<void> {
    await this.trackConsentRemoved.execute();

    await this.storageService.removeUserConsent();
  }

  async getConsentDetails(): Promise<UserConsent | undefined> {
    const consent = await this.storageService.getUserConsent();
    return consent.isJust() ? consent.extract() : undefined;
  }
}

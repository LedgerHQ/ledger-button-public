import { UserConsent } from "@internal/storage/model/UserConsent";

export interface ConsentService {
  hasConsent(): Promise<boolean>;
  hasRespondedToConsent(): Promise<boolean>;
  giveConsent(): Promise<void>;
  refuseConsent(): Promise<void>;
  removeConsent(): Promise<void>;
  getConsentDetails(): Promise<UserConsent | undefined>;
}

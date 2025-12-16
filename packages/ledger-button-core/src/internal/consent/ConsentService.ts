import { UserConsent } from "../storage/model/UserConsent.js";

export interface ConsentService {
  hasConsent(): boolean;
  hasRespondedToConsent(): boolean;
  giveConsent(): Promise<void>;
  refuseConsent(): Promise<void>;
  removeConsent(): Promise<void>;
  getConsentDetails(): UserConsent | undefined;
}

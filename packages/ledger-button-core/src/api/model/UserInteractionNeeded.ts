export type UserInteractionNeeded = "unlock-device" | "continue-on-device";
export type UserInteractionNeededResponse = {
  requiredUserInteraction: UserInteractionNeeded;
};

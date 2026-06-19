import { UserInfo } from "@/features/users/services/user.service";
import { useOnboardingStore } from "../stores/onboarding.store";

/**
 * Determines if a user needs to complete onboarding
 * We'll consider users who haven't completed onboarding as needing it,
 * even if they have names from OAuth providers
 */
export const isOnboardingRequired = (user: UserInfo | null): boolean => {
  if (!user) return false;

  const hasRequiredInfo = Boolean(user.name);

  if (!hasRequiredInfo) {
    return true;
  }

  const complete = useOnboardingStore.getState().isCompleted;
  return !complete;
};

export const shouldSkipNameStep = (user: UserInfo | null): boolean => {
  if (!user) return false;

  return Boolean(user.name);
};

/**
 * Gets the appropriate onboarding entry point based on user status
 */
export const getOnboardingEntryPoint = (_user: UserInfo | null): string => {
  return "/onboarding/welcome";
};

export const isOnboardingCompleted = (user: UserInfo | null, onboardingCompleted: boolean): boolean => {
  if (!user) return false;

  const hasRequiredInfo = Boolean(user.name);

  return hasRequiredInfo && Boolean(onboardingCompleted);
};

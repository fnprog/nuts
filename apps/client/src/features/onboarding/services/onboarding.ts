import { UserInfo } from "@/features/users/services/user.service";
import { logger } from "@/lib/logger";
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
  return !complete

};

export const shouldSkipNameStep = (user: UserInfo | null): boolean => {
  if (!user) return false;

  return Boolean(user.name);
};

/**
 * Gets the appropriate onboarding entry point based on user status
 */
export const getOnboardingEntryPoint = (user: UserInfo | null): string => {
  if (!user) return "/onboarding/name";

  // If user has names from OAuth, skip to step 2
  if (shouldSkipNameStep(user)) {
    return "/onboarding/finance-interest";
  }

  return "/onboarding/name";
};

export const isOnboardingCompleted = (user: UserInfo | null, onboardingCompleted: boolean): boolean => {
  if (!user) return false;

  const hasRequiredInfo = Boolean(user.name);

  return hasRequiredInfo && Boolean(onboardingCompleted);
};

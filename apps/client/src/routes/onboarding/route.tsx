import { createFileRoute, redirect, Outlet, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { isOnboardingRequired } from "@/features/onboarding/services/onboarding";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Progress } from "@/core/components/ui/progress";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Nuts } from "@/core/components/icons/Logo";

//TODO: Use the logger instead of the console.error

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context, location }) => {

    if (!context.auth.isAuthenticated && !context.auth.isAnonymous) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const user = useAuthStore.getState().user;

    if (user && !isOnboardingRequired(user)) {
      throw redirect({
        to: "/dashboard/home",
      });
    }

  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <OnboardingProgress />
      <div className="px-4 pt-20 flex flex-1 items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full">
          <main className="w-full flex flex-1 items-center justify-center">
            <Outlet />
          </main>
        </motion.div>
      </div>
    </div>
  );
}

function OnboardingProgress() {
  const step = useOnboardingStore((state) => state.currentStep);
  const totalSteps = 8;
  const progressValue = ((step + 1) / totalSteps) * 100;

  return (

    <div className="fixed flex flex-col left-0 right-0 top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/login">
          <Nuts className="h-8 w-8" fill="var(--color-primary)" />
        </Link>
      </div>

      <div className="flex-1 w-full">
        <Progress value={progressValue} className="h-1 w-full  " />
      </div>
    </div>
  )
}

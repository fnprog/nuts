import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";
import { isOnboardingRequired } from "@/features/onboarding/services/onboarding";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    try {
      const user = useAuthStore.getState().user;

      if (user && !isOnboardingRequired(user)) {
        throw redirect({
          to: "/dashboard/home",
        });
      }
    } catch (redirectError) {
      if (redirectError && typeof redirectError === "object" && "type" in redirectError) {
        throw redirectError;
      }
      console.error("Failed to check onboarding completion status:", redirectError);
    }
  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-lg">
        <main className="w-full">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}

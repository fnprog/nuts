import { createFileRoute, redirect, Outlet, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { isOnboardingRequired } from "@/features/onboarding/services/onboarding";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Nuts } from "@/core/components/icons/Logo";
import { cn } from "@/lib/utils";
import { LiveOSPreview } from "@/features/onboarding/components/live-os-preview";

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
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Left Panel: The Wizard */}
      <div className="flex w-full flex-col md:w-[450px] lg:w-[500px] xl:w-[600px] border-r border-border/40 bg-card/30 backdrop-blur-sm z-10">
        <header className="px-8 pt-8 pb-4">
          <Link to="/dashboard/home" className="inline-block mb-12">
             <Nuts className="h-10 w-10" fill="var(--color-primary)" />
          </Link>
          <OnboardingProgress />
        </header>

        <main className="flex-1 px-8 py-4 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
             <Outlet />
          </AnimatePresence>
        </main>
      </div>

      {/* Right Panel: Live OS Preview */}
      <div className="hidden md:flex flex-1 bg-muted/30 items-center justify-center p-8 lg:p-12 xl:p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.05),transparent_70%)]" />
        <LiveOSPreview />
      </div>
    </div>
  );
}

function OnboardingProgress() {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const steps = [
    { id: 0, label: "Welcome" },
    { id: 1, label: "Profile" },
    { id: 2, label: "Accounts" },
    { id: 3, label: "Income" },
    { id: 4, label: "Snapshot" },
  ];

  return (
    <nav className="w-full space-y-6">
      <div className="flex justify-between items-center px-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-widest transition-colors duration-300",
              currentStep >= step.id ? "text-primary" : "text-muted-foreground/40"
            )}>
              {idx + 1}. {step.label}
            </span>
          </div>
        ))}
      </div>
      
      <div className="relative h-px w-full bg-muted-foreground/10 mx-auto">
        <div className="absolute inset-0 flex justify-between -top-1">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full border transition-all duration-500 ease-out",
                currentStep === step.id ? "bg-primary border-primary scale-125 ring-4 ring-primary/10" : 
                currentStep > step.id ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <motion.div 
           initial={false}
           animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
           className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
        />
      </div>
    </nav>
  );
}



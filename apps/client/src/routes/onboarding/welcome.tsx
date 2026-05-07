import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { motion } from "motion/react";
import { RiArrowRightLine } from "@remixicon/react";

export const Route = createFileRoute("/onboarding/welcome")({
  component: WelcomeStep,
});

function WelcomeStep() {
  const setStep = useOnboardingStore((state) => state.setStep);
  const navigate = useNavigate();

  useEffect(() => {
    setStep(0);
  }, [setStep]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex w-full flex-col gap-6 pt-4 pb-2">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to your Financial OS <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">This isn't a budget app. It's your complete financial system.</p>
      </div>

      <div className="text-muted-foreground/80 space-y-3 text-base leading-relaxed">
        <p>Over the next few minutes, we'll build your personal financial picture — net worth, cashflow, investments, goals, and more.</p>
        <p>The more you add, the smarter it gets. But you can always add things later.</p>
        <p className="text-foreground font-semibold">Let's start simple.</p>
      </div>

      <div className="pt-2">
        <Button variant="primary" onClick={() => navigate({ to: "/onboarding/profile" })} className="group h-11 gap-2 rounded-xl px-6">
          Let's build it
          <RiArrowRightLine className="transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}

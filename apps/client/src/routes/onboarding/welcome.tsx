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

  const handleNext = () => {
    navigate({ to: "/onboarding/profile" });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-md w-full py-12 flex flex-col gap-8"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to your Financial OS <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          This isn't a budget app. It's your complete financial system.
        </p>
      </div>

      <div className="space-y-6 text-muted-foreground/80 leading-relaxed">
        <p>
          Over the next few minutes, we'll build your personal financial picture — 
          net worth, cashflow, investments, goals, and more.
        </p>
        <p>
          The more you add, the smarter it gets. But you can always add things later.
        </p>
        <p className="font-medium text-foreground">
          Let's start simple.
        </p>
      </div>

      <div className="pt-8">
        <Button size="lg" onClick={handleNext} className="gap-2 h-14 px-8 text-lg rounded-xl transition-all duration-300 hover:gap-4 group">
          Let's build it
          <RiArrowRightLine className="size-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}

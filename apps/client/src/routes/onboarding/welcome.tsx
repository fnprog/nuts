import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { motion } from "motion/react";
import { RiArrowRightLine } from "@remixicon/react";
import { H1, Large, P } from "@/core/components/ui/typography";

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
        <H1>
          Welcome to your Financial OS <span className="inline-block animate-bounce">👋</span>
        </H1>
        <Large>This isn't a budget app. It's your complete financial system.</Large>
      </div>

      <div className="space-y-6">
        <P>Over the next few minutes, we'll build your personal financial picture — net worth, cashflow, investments, goals, and more.</P>
        <P>The more you add, the smarter it gets. But you can always add things later.</P>
        <P className="font-semibold">Let's start simple.</P>
      </div>

      <div>
        <Button variant="primary" onClick={() => navigate({ to: "/onboarding/profile" })} className="group">
          Let's build it
          <RiArrowRightLine className="transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}

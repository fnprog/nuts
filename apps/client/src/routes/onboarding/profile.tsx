import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOnboardingStore, type FinancialStage } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { motion } from "motion/react";
import { RiArrowRightLine, RiSeedlingLine, RiLineChartLine, RiHome4Line, RiFocus2Line } from "@remixicon/react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/profile")({
  component: ProfileStep,
});

function ProfileStep() {
  const { setStep, name, setName, currency, setCurrency, financialStage, setFinancialStage } = useOnboardingStore();
  const navigate = useNavigate();

  useEffect(() => {
    setStep(1);
  }, [setStep]);

  const stages: { id: FinancialStage; title: string; desc: string; icon: any }[] = [
    {
      id: "foundation",
      title: "Building my foundation",
      desc: "Getting control of spending, paying down debt, starting to save",
      icon: RiSeedlingLine,
    },
    {
      id: "wealth",
      title: "Growing my wealth",
      desc: "Investing, building assets, multiple income streams",
      icon: RiLineChartLine,
    },
    {
      id: "goal",
      title: "Working toward a big goal",
      desc: "House, car, education — I have something specific I'm saving for",
      icon: RiHome4Line,
    },
    {
      id: "event",
      title: "Planning a life event",
      desc: "Wedding, baby, retirement — a major change is coming",
      icon: RiFocus2Line,
    },
  ];

  const handleNext = () => {
    if (name && financialStage) {
      navigate({ to: "/onboarding/accounts" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex w-full flex-col gap-10 pt-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">First, a bit about you</h1>
        <p className="text-muted-foreground mt-3 text-base">Tell us who you are and where you're at in your journey.</p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">What should we call you?</Label>
            <Input id="name" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency">primary currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GHS">🇬🇭 GHS — Cedi</SelectItem>
                <SelectItem value="USD">🇺🇸 USD — Dollar</SelectItem>
                <SelectItem value="EUR">🇪🇺 EUR — Euro</SelectItem>
                <SelectItem value="GBP">🇬🇧 GBP — Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Your financial stage</Label>
          <div className="grid gap-3">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setFinancialStage(stage.id)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 group",
                  financialStage === stage.id
                    ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                    : "bg-card border-border/50 hover:border-border hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 size-10 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                    financialStage === stage.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}
                >
                  <stage.icon size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={cn("font-semibold text-sm transition-colors", financialStage === stage.id ? "text-primary" : "text-foreground")}>
                    {stage.title}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed">{stage.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-1">
        <Button variant="primary" size="lg" onClick={handleNext} disabled={!name || !financialStage} className="h-11 w-full gap-2 rounded-xl">
          Next
          <RiArrowRightLine />
        </Button>
      </div>
    </motion.div>
  );
}

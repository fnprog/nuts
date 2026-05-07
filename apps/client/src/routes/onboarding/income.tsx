import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { RiArrowRightLine, RiBriefcaseLine, RiBrushLine, RiStore2Line, RiExchangeLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/income")({
  component: IncomeStep,
});

function IncomeStep() {
  const { setStep, setIncome, currency } = useOnboardingStore();
  const navigate = useNavigate();
  const [incomeType, setIncomeType] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [lowAmount, setLowAmount] = useState("");
  const [highAmount, setHighAmount] = useState("");

  useEffect(() => {
    setStep(3);
  }, [setStep]);

  const types = [
    { id: "salary", label: "Salary / Employment", icon: RiBriefcaseLine },
    { id: "freelance", label: "Freelance / Contract", icon: RiBrushLine },
    { id: "business", label: "Business Owner", icon: RiStore2Line },
    { id: "mixed", label: "Mixed / Multiple", icon: RiExchangeLine },
  ];

  const isValid = incomeType && (frequency !== "irregular" ? !!amount : !!lowAmount && !!highAmount);

  const handleNext = () => {
    if (!isValid) return;

    setIncome({
      type: incomeType,
      amount: parseFloat(amount || highAmount),
      frequency,
      lowAmount: lowAmount ? parseFloat(lowAmount) : undefined,
      highAmount: highAmount ? parseFloat(highAmount) : undefined,
    });
    navigate({ to: "/onboarding/snapshot" });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex w-full flex-col gap-5 pt-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Now let's understand what comes in</h1>
        <p className="text-muted-foreground mt-1 text-sm">Income data powers your budget engine and health score.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">What's your main income source?</Label>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setIncomeType(t.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 group",
                  incomeType === t.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card border-border/50 hover:border-border hover:bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "size-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    incomeType === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}
                >
                  <t.icon size={14} />
                </div>
                <span className={cn("text-xs font-semibold transition-colors leading-tight", incomeType === t.id ? "text-primary" : "text-foreground")}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {incomeType && (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="freq" className="text-xs">
                  When do you usually get paid?
                </Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="freq" className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="irregular">Irregularly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency !== "irregular" ? (
                <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs">
                    Monthly amount (approximate)
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold">{currency}</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-11 rounded-lg pl-12 text-lg font-bold"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="irregular" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-primary/5 border-primary/10 rounded-xl border px-3.5 py-2.5">
                    <p className="text-primary/70 text-[11px] leading-relaxed">
                      "No fixed income? That's fine. We'll build your budget around the conservative number."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="low" className="text-xs">
                        Typical slow month
                      </Label>
                      <div className="relative">
                        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-semibold">{currency}</span>
                        <Input id="low" type="number" value={lowAmount} onChange={(e) => setLowAmount(e.target.value)} className="h-10 rounded-lg pl-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="high" className="text-xs">
                        Typical good month
                      </Label>
                      <div className="relative">
                        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-semibold">{currency}</span>
                        <Input id="high" type="number" value={highAmount} onChange={(e) => setHighAmount(e.target.value)} className="h-10 rounded-xl pl-10" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="pt-1">
                <Button onClick={handleNext} disabled={!isValid} className="h-11 w-full gap-2 rounded-xl">
                  That's all my income
                  <RiArrowRightLine size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

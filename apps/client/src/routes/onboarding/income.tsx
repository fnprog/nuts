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

  const handleNext = () => {
    if (incomeType && (amount || (lowAmount && highAmount))) {
      setIncome({
        type: incomeType,
        amount: parseFloat(amount || highAmount),
        frequency,
        lowAmount: lowAmount ? parseFloat(lowAmount) : undefined,
        highAmount: highAmount ? parseFloat(highAmount) : undefined,
      });
      navigate({ to: "/onboarding/snapshot" });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md w-full py-6 flex flex-col gap-10"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Now let's understand what comes in</h1>
        <p className="text-muted-foreground leading-relaxed">
           Income data powers your budget engine and health score.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
           <Label>What's your main income source?</Label>
           <div className="grid grid-cols-2 gap-3">
              {types.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => setIncomeType(t.id)}
                   className={cn(
                     "flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-200 group",
                     incomeType === t.id 
                       ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                       : "bg-card border-border/50 hover:border-border hover:bg-muted/50"
                   )}
                 >
                    <div className={cn(
                      "size-10 rounded-lg flex items-center justify-center transition-colors",
                      incomeType === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    )}>
                       <t.icon size={20} />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold transition-colors",
                      incomeType === t.id ? "text-primary" : "text-foreground"
                    )}>
                      {t.label}
                    </span>
                 </button>
              ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
           {incomeType && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label htmlFor="freq">When do you usually get paid?</Label>
                       <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger id="freq" className="h-12 rounded-xl">
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
                       <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="amount">Monthly amount (approximate)</Label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">{currency}</span>
                             <Input 
                               id="amount" 
                               type="number"
                               placeholder="0.00" 
                               value={amount}
                               onChange={(e) => setAmount(e.target.value)}
                               className="h-12 pl-14 text-xl font-bold rounded-xl"
                             />
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                             <p className="text-xs text-primary/80 leading-relaxed italic">
                               "No fixed income? That's fine. We'll build your budget around the conservative number."
                             </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="low">Typical slow month</Label>
                                <div className="relative">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">{currency}</span>
                                   <Input id="low" type="number" value={lowAmount} onChange={(e) => setLowAmount(e.target.value)} className="pl-10 h-11 rounded-xl" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="high">Typical good month</Label>
                                <div className="relative">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">{currency}</span>
                                   <Input id="high" type="number" value={highAmount} onChange={(e) => setHighAmount(e.target.value)} className="pl-10 h-11 rounded-xl" />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>

                 <Button onClick={handleNext} disabled={!incomeType || (frequency !== 'irregular' ? !amount : (!lowAmount || !highAmount))} className="w-full h-14 rounded-xl text-lg gap-2 mt-4">
                    That's all my income
                    <RiArrowRightLine size={20} />
                 </Button>
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

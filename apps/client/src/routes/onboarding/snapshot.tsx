import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { RiCheckLine, RiSparklesLine, RiArrowRightLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/snapshot")({
  component: SnapshotStep,
});

function SnapshotStep() {
  const { setStep, name, completeOnboarding } = useOnboardingStore();
  const navigate = useNavigate();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setStep(4);
    
    const loadingTexts = [
       "Accounts mapped",
       "Income understood",
       "Calculating your health score",
       "Preparing your command center"
    ];

    let timer: any;
    if (loadingStep < loadingTexts.length) {
       timer = setTimeout(() => {
          setLoadingStep(prev => prev + 1);
       }, 800);
    } else {
       setIsReady(true);
    }

    return () => clearTimeout(timer);
  }, [loadingStep, setStep]);

  const loadingTexts = [
     "Accounts mapped",
     "Income understood",
     "Calculating your health score",
     "Preparing your command center"
  ];

  const handleFinish = () => {
    completeOnboarding();
    navigate({ to: "/dashboard/home" });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md w-full py-6 flex flex-col gap-10"
    >
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 space-y-8"
          >
             <div className="flex flex-col items-center gap-6 text-center">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                   <RiSparklesLine size={32} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Building your financial picture...</h2>
             </div>

             <div className="space-y-4 max-w-[280px] mx-auto">
                {loadingTexts.map((text, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded-full flex items-center justify-center border transition-colors duration-500",
                        loadingStep > idx ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
                      )}>
                         {loadingStep > idx ? <RiCheckLine size={12} /> : null}
                      </div>
                      <span className={cn(
                        "text-sm font-medium transition-colors duration-500",
                        loadingStep === idx ? "text-primary" : 
                        loadingStep > idx ? "text-muted-foreground/60" : "text-muted-foreground/20"
                      )}>
                        {text}
                      </span>
                   </div>
                ))}
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
             <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Your financial picture is ready, {name.split(' ')[0]}.</h1>
                <p className="text-muted-foreground leading-relaxed">
                   Here's how your Financial Health Score stands today.
                </p>
             </div>

             <div className="bg-gradient-to-br from-primary to-primary-900 rounded-3xl p-8 text-white shadow-2xl shadow-primary/20 flex flex-col items-center text-center gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Financial Health Score</span>
                <div className="text-8xl font-black tracking-tighter">68</div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold">Good start 🟢</div>
             </div>

             <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Here's what shaped your score:</p>
                <div className="grid gap-3">
                   {[
                      { label: "Income tracked", pts: "+15 pts", done: true },
                      { label: "Accounts mapped", pts: "+12 pts", done: true },
                      { label: "Emergency fund", pts: "0/20", done: false },
                      { label: "Debt tracked", pts: "0/20", done: false },
                   ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                         <div className="flex items-center gap-2">
                            <div className={cn("size-2 rounded-full", item.done ? "bg-primary" : "bg-muted")} />
                            <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                         </div>
                         <span className={cn("text-[10px] font-mono", item.done ? "text-primary" : "text-muted-foreground/40")}>{item.pts}</span>
                      </div>
                   ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-2 text-center">Your score can reach 100. Each section you complete unlocks more of your picture.</p>
             </div>

             <Button size="lg" onClick={handleFinish} className="w-full h-14 rounded-xl text-lg gap-2 shadow-xl shadow-primary/10 group">
                Enter my OS
                <RiArrowRightLine size={20} className="transition-transform group-hover:translate-x-1" />
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

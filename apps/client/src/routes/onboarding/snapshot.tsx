import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { RiCheckLine, RiSparklingLine, RiArrowRightLine, RiLoader4Line } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { accountService } from "@/features/accounts/services/account";
import { transactionService } from "@/features/transactions/services/transaction.service";

export const Route = createFileRoute("/onboarding/snapshot")({
  component: SnapshotStep,
});

const LOADING_TEXTS = ["Accounts mapped", "Income understood", "Calculating your health score", "Preparing your command center"];

const SCORE_BREAKDOWN = [
  { label: "Income tracked", pts: "+15 pts", done: true },
  { label: "Accounts mapped", pts: "+12 pts", done: true },
  { label: "Emergency fund", pts: "0/20", done: false },
  { label: "Debt tracked", pts: "0/20", done: false },
  { label: "Investments", pts: "0/15", done: false },
];

const SCORE = 68;
const SCORE_MAX = 100;
const CIRCUMFERENCE = 2 * Math.PI * 30;

function ScoreRing({ score }: { score: number }) {
  const pct = score / SCORE_MAX;
  return (
    <div className="relative size-28">
      <svg className="size-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="transparent" stroke="currentColor" strokeWidth="7" className="text-primary/10"></circle>
        <motion.circle
          cx="44"
          cy="44"
          r="36"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
          animate={{ strokeDasharray: `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="text-3xl leading-none font-black tracking-tighter"
        >
          {score}
        </motion.span>
        <span className="text-muted-foreground/50 mt-0.5 text-[9px] font-medium tracking-wider uppercase">/100</span>
      </div>
    </div>
  );
}

const ACCOUNT_TYPE_MAP: Record<string, "momo" | "checking" | "cash" | "other"> = {
  mtm: "momo",
  telecel: "momo",
  bank: "checking",
  cash: "cash",
};

function SnapshotStep() {
  const { setStep, name, accounts, currency, completeOnboarding } = useOnboardingStore();
  const navigate = useNavigate();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setStep(4);
  }, [setStep]);

  useEffect(() => {
    if (loadingStep < LOADING_TEXTS.length) {
      const t = setTimeout(() => {
        setLoadingStep((p) => p + 1);
      }, 700);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setIsReady(true);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [loadingStep]);

  const handleFinish = useCallback(async () => {
    setIsCreating(true);
    try {
      for (const acc of accounts) {
        const actRes = await accountService.createAccount({
          name: acc.name || acc.type,
          type: ACCOUNT_TYPE_MAP[acc.type] ?? "other",
          balance: acc.balance,
          currency,
        });

        if (actRes.isOk() && acc.balance !== 0) {
          const accountId = actRes.value.id;
          await transactionService.createTransaction({
            account_id: accountId,
            amount: acc.balance,
            type: "income",
            description: "Opening Balance",
            transaction_datetime: new Date(),
          });
        }
      }
    } catch { /* intentionally empty */ }

    completeOnboarding();
    navigate({ to: "/dashboard/home" });
  }, [accounts, currency, completeOnboarding, navigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col gap-5 pt-4 pb-2">
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3 pt-6 text-center">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
                <RiSparklingLine size={24} className="animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Building your financial picture...</h2>
            </div>

            <div className="mx-auto max-w-[260px] space-y-3">
              {LOADING_TEXTS.map((text, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: loadingStep > idx ? 0.5 : loadingStep === idx ? 1 : 0.25 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "size-4 rounded-full flex items-center justify-center border transition-colors duration-500",
                      loadingStep > idx ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
                    )}
                  >
                    {loadingStep > idx ? <RiCheckLine size={10} /> : null}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-500",
                      loadingStep === idx ? "text-primary" : loadingStep > idx ? "text-muted-foreground/50" : "text-muted-foreground/25"
                    )}
                  >
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 10 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Your financial picture is ready, {name.split(" ")[0]}.</h1>
              <p className="text-muted-foreground mt-1 text-sm">Here's how your Financial Health Score stands today.</p>
            </div>

            <div className="bg-primary/5 border-primary/15 flex items-center gap-5 rounded-2xl border p-4">
              <ScoreRing score={SCORE} />

              <div className="flex flex-col gap-1.5">
                <span className="text-primary/60 text-[10px] font-bold tracking-[0.15em] uppercase">Financial Health Score</span>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-600">Good Start </span>
                </div>
                <p className="text-muted-foreground max-w-40 text-[11px] leading-relaxed">Your score can reach 100. Each section you complete unlocks more.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Here's what shaped your score:</p>
              <div className="border-border/50 overflow-hidden rounded-xl border">
                {SCORE_BREAKDOWN.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex justify-between items-center px-3.5 py-2.5 text-xs",
                      i < SCORE_BREAKDOWN.length - 1 && "border-b border-border/40",
                      item.done ? "bg-primar[0.03]" : ""
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("size-1.5 rounded-full", item.done ? "bg-primary" : "bg-muted-foreground/20")} />
                      <span className={cn(item.done ? "text-foreground font-medium" : "text-muted-foreground/60")}>{item.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", item.done ? "text-primary" : "text-muted-foreground/60")}>{item.pts}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-center text-[10px] italic">
                Your score can reach 100. Each section you complete unlocks more of your picture.
              </p>
            </div>

            <Button size="lg" onClick={handleFinish} disabled={isCreating} className="shadow-primary/10 group h-11 w-full gap-2 rounded-xl shadow-lg">
              {isCreating ? (
                <>
                  <RiLoader4Line size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Enter my OS
                  <RiArrowRightLine size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

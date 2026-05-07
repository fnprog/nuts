import { useOnboardingStore } from "../stores/onboarding.store";
import { motion, AnimatePresence } from "motion/react";
import { RiDashboardLine, RiBankCardLine, RiStackLine, RiWalletLine, RiPieChartLine, RiArrowUpLine } from "@remixicon/react";

export function LiveOSPreview() {
  const { name, accounts, income, currentStep } = useOnboardingStore();

  return (
    <div className="bg-background border-border/50 group relative flex aspect-[16/10] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
      {/* OS Header */}
      <header className="border-border/50 bg-card/50 flex h-14 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full border border-red-500/30 bg-red-500/20" />
            <div className="h-3 w-3 rounded-full border border-yellow-500/30 bg-yellow-500/20" />
            <div className="h-3 w-3 rounded-full border border-green-500/30 bg-green-500/20" />
          </div>
          <div className="bg-border/50 mx-2 h-6 w-px" />
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground/60 text-xs font-medium tracking-tight">
            Financial OS <span className="opacity-40">/ Dashboard</span>
          </motion.span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 h-8 w-8 rounded-full border" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Mini */}
        <aside className="border-border/50 bg-card/30 flex w-16 flex-col items-center gap-6 border-r py-6">
          <RiDashboardLine size={20} className="text-primary" />
          <RiBankCardLine size={20} className="text-muted-foreground/40" />
          <RiStackLine size={20} className="text-muted-foreground/40" />
          <RiWalletLine size={20} className="text-muted-foreground/40" />
          <RiPieChartLine size={20} className="text-muted-foreground/40" />
        </aside>

        {/* Main Dashboard Content */}
        <main className="custom-scrollbar relative flex-1 overflow-y-auto p-8">
          {/* Welcome Section */}
          <section className="mb-10">
            <motion.h2 key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold tracking-tight">
              Good morning, <span className="text-primary">{name || "Friend"}</span>
            </motion.h2>
            <p className="text-muted-foreground/60 mt-1 text-sm">Here's your financial overview for today.</p>
          </section>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Net Worth Widget */}
            <motion.div layout className="bg-card border-border/50 col-span-8 flex flex-col justify-between rounded-xl border p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <span className="text-muted-foreground/60 text-sm font-medium">Net Worth</span>
                <div className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <RiArrowUpLine size={14} />
                  <span>+2.4%</span>
                </div>
              </div>
              <motion.div
                key={accounts.reduce((sum, a) => sum + a.balance, 0)}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold tracking-tighter"
              >
                GH¢ {accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
              </motion.div>
              <div className="bg-primary/5 border-primary/10 mt-6 flex h-20 w-full items-end gap-1 rounded-lg border p-2">
                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-primary/20 flex-1 rounded-t-sm"
                  />
                ))}
              </div>
            </motion.div>

            {/* Health Score Widget */}
            <motion.div
              layout
              className="bg-primary/5 border-primary/20 relative col-span-4 flex flex-col items-center justify-center overflow-hidden rounded-xl border p-6 text-center shadow-sm"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.1),transparent_70%)]" />
              <span className="text-primary/60 mb-4 text-xs font-semibold tracking-widest uppercase">Health Score</span>
              <div className="relative size-32">
                <svg className="size-full" viewBox="0 0 100 100">
                  <circle className="text-primary/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="38" cx="50" cy="50" />
                  <motion.circle
                    initial={{ strokeDasharray: "0 240" }}
                    animate={{ strokeDasharray: `${(currentStep / 5) * 240} 240` }}
                    className="text-primary"
                    strokeWidth="8"
                    strokeDashcap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="38"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold tracking-tighter">{((currentStep / 5) * 100).toFixed(0)}</span>
                </div>
              </div>
              <p className="text-muted-foreground/60 mt-4 max-w-[120px] text-[10px]">Your score improves as you complete onboarding.</p>
            </motion.div>

            {/* Accounts List (Animated In Step 3) */}
            <AnimatePresence>
              {(currentStep >= 2 || accounts.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 space-y-4">
                  <h3 className="text-muted-foreground/80 text-sm font-semibold">Active Accounts</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {accounts.length > 0 ? (
                      accounts.map((acc, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-card border-border/50 flex items-center gap-4 rounded-xl border p-4"
                        >
                          <div className="bg-muted/50 text-primary flex size-10 items-center justify-center rounded-full">
                            <RiBankCardLine size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="max-w-[100px] truncate text-xs font-medium">{acc.name}</span>
                            <span className="text-sm font-bold">GH¢ {acc.balance.toLocaleString()}</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="border-border/50 text-muted-foreground/40 col-span-3 flex h-24 items-center justify-center rounded-xl border border-dashed text-xs">
                        No accounts added yet
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cashflow (Step 4) */}
            <AnimatePresence>
              {(currentStep >= 3 || income) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border-border/50 col-span-12 rounded-xl border p-6"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-muted-foreground/80 text-sm font-semibold">Monthly Cashflow</h3>
                    <div className="flex gap-4">
                      <div className="text-muted-foreground/60 flex items-center gap-1.5 text-[10px]">
                        <div className="bg-primary size-2 rounded-full" />
                        Income
                      </div>
                      <div className="text-muted-foreground/60 flex items-center gap-1.5 text-[10px]">
                        <div className="bg-muted/40 size-2 rounded-full" />
                        Spending
                      </div>
                    </div>
                  </div>
                  <div className="flex h-32 w-full items-end gap-3 px-2">
                    {[60, 40, 85, 30, 90, 55, 75, 45, 95, 65, 80, 100].map((h, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className="bg-primary/20 w-full rounded-t-sm" />
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h * 0.6}%` }} className="bg-muted/10 w-full rounded-t-sm" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Blueprint Overlay (Step 0) */}
      {currentStep === 0 && (
        <div className="bg-background/20 pointer-events-none absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
          <div className="border-primary/20 text-primary/40 rounded-3xl border-2 border-dashed p-8 font-mono text-xs tracking-[0.2em] uppercase">
            Building your financial profile...
          </div>
        </div>
      )}
    </div>
  );
}

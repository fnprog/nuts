import { useOnboardingStore } from "../stores/onboarding.store";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { 
  RiDashboardLine, 
  RiBankCardLine, 
  RiStackLine, 
  RiWalletLine, 
  RiPieChartLine,
  RiArrowUpLine,
  RiArrowDownLine
} from "@remixicon/react";

export function LiveOSPreview() {
  const { name, financialStage, accounts, income, currentStep } = useOnboardingStore();

  return (
    <div className="w-full max-w-5xl aspect-[16/10] bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col relative group">
      {/* OS Header */}
      <header className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
           </div>
           <div className="h-6 w-px bg-border/50 mx-2" />
           <motion.span 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-xs font-medium text-muted-foreground/60 tracking-tight"
           >
             Financial OS <span className="opacity-40">/ Dashboard</span>
           </motion.span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini */}
        <aside className="w-16 border-r border-border/50 bg-card/30 flex flex-col items-center py-6 gap-6">
           <RiDashboardLine size={20} className="text-primary" />
           <RiBankCardLine size={20} className="text-muted-foreground/40" />
           <RiStackLine size={20} className="text-muted-foreground/40" />
           <RiWalletLine size={20} className="text-muted-foreground/40" />
           <RiPieChartLine size={20} className="text-muted-foreground/40" />
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
           {/* Welcome Section */}
           <section className="mb-10">
              <motion.h2 
                key={name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-semibold tracking-tight"
              >
                Good morning, <span className="text-primary">{name || "Friend"}</span>
              </motion.h2>
              <p className="text-muted-foreground/60 text-sm mt-1">Here's your financial overview for today.</p>
           </section>

           {/* Dashboard Grid */}
           <div className="grid grid-cols-12 gap-6">
              {/* Net Worth Widget */}
              <motion.div 
                layout
                className="col-span-8 bg-card rounded-xl border border-border/50 p-6 shadow-sm flex flex-col justify-between"
              >
                 <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-muted-foreground/60">Net Worth</span>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
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
                 <div className="h-20 w-full mt-6 bg-primary/5 rounded-lg border border-primary/10 flex items-end p-2 gap-1">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                       <motion.div 
                         key={i}
                         initial={{ height: 0 }}
                         animate={{ height: `${h}%` }}
                         transition={{ delay: i * 0.1 }}
                         className="flex-1 bg-primary/20 rounded-t-sm"
                       />
                    ))}
                 </div>
              </motion.div>

              {/* Health Score Widget */}
              <motion.div 
                layout
                className="col-span-4 bg-primary/5 rounded-xl border border-primary/20 p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
              >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.1),transparent_70%)]" />
                 <span className="text-xs font-semibold text-primary/60 uppercase tracking-widest mb-4">Health Score</span>
                 <div className="relative size-32">
                    <svg className="size-full" viewBox="0 0 100 100">
                       <circle 
                         className="text-primary/10" 
                         strokeWidth="8" 
                         stroke="currentColor" 
                         fill="transparent" 
                         r="38" 
                         cx="50" 
                         cy="50" 
                       />
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
                       <span className="text-3xl font-bold tracking-tighter">{(currentStep / 5 * 100).toFixed(0)}</span>
                    </div>
                 </div>
                 <p className="text-[10px] text-muted-foreground/60 mt-4 max-w-[120px]">
                    Your score improves as you complete onboarding.
                 </p>
              </motion.div>

              {/* Accounts List (Animated In Step 3) */}
              <AnimatePresence>
                 {(currentStep >= 2 || accounts.length > 0) && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="col-span-12 space-y-4"
                   >
                      <h3 className="text-sm font-semibold text-muted-foreground/80">Active Accounts</h3>
                      <div className="grid grid-cols-3 gap-4">
                         {accounts.length > 0 ? accounts.map((acc, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4"
                            >
                               <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center text-primary">
                                  <RiBankCardLine size={20} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-xs font-medium truncate max-w-[100px]">{acc.name}</span>
                                  <span className="text-sm font-bold">GH¢ {acc.balance.toLocaleString()}</span>
                               </div>
                            </motion.div>
                         )) : (
                            <div className="col-span-3 h-24 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/40 text-xs">
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
                     className="col-span-12 bg-card rounded-xl border border-border/50 p-6"
                   >
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-semibold text-muted-foreground/80">Monthly Cashflow</h3>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                               <div className="size-2 rounded-full bg-primary" />
                               Income
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                               <div className="size-2 rounded-full bg-muted/40" />
                               Spending
                            </div>
                         </div>
                      </div>
                      <div className="h-32 w-full flex items-end gap-3 px-2">
                         {[60, 40, 85, 30, 90, 55, 75, 45, 95, 65, 80, 100].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-1 h-full justify-end">
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: `${h}%` }}
                                 className="w-full bg-primary/20 rounded-t-sm"
                               />
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: `${h * 0.6}%` }}
                                 className="w-full bg-muted/10 rounded-t-sm"
                               />
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
         <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
            <div className="p-8 border-2 border-dashed border-primary/20 rounded-3xl text-primary/40 font-mono text-xs uppercase tracking-[0.2em]">
               Building your financial profile...
            </div>
         </div>
      )}
    </div>
  );
}

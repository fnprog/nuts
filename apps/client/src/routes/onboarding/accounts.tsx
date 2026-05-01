import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import { RiArrowRightLine, RiAddLine, RiSmartphoneLine, RiBankLine, RiCoinsLine, RiCheckLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/accounts")({
  component: AccountsStep,
});

function AccountsStep() {
  const { setStep, addAccount, accounts, currency } = useOnboardingStore();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState("");
  const [isAdding, setIsAdding] = useState(true);

  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const accountTypes = [
    { id: "mtn", label: "MTN MoMo", icon: RiSmartphoneLine, color: "bg-yellow-400/10 text-yellow-600 border-yellow-400/20" },
    { id: "telecel", label: "Vodafone Cash", icon: RiSmartphoneLine, color: "bg-red-500/10 text-red-600 border-red-500/20" },
    { id: "bank", label: "Bank Account", icon: RiBankLine, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { id: "cash", label: "Cash", icon: RiCoinsLine, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ];

  const handleAdd = () => {
    if (selectedType && balance) {
      const typeLabel = accountTypes.find(t => t.id === selectedType)?.label || "Other";
      addAccount({
        type: selectedType,
        name: accountName || typeLabel,
        balance: parseFloat(balance),
      });
      setSelectedType(null);
      setAccountName("");
      setBalance("");
      setIsAdding(false);
    }
  };

  const handleNext = () => {
    navigate({ to: "/onboarding/income" });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md w-full py-6 flex flex-col gap-8"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Where does your money live?</h1>
        <p className="text-muted-foreground leading-relaxed">
          {accounts.length === 0 
            ? "Let's start with your main account. You can add more in a moment."
            : "Great start! Your net worth is taking shape."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {!selectedType ? (
               <div className="grid grid-cols-2 gap-4">
                  {accountTypes.map((type) => (
                     <button
                       key={type.id}
                       onClick={() => setSelectedType(type.id)}
                       className={cn(
                         "flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group",
                         type.color
                       )}
                     >
                        <type.icon size={32} />
                        <span className="font-semibold text-xs tracking-wide">{type.label}</span>
                     </button>
                  ))}
                  <button 
                    onClick={() => setSelectedType("other")}
                    className="col-span-2 p-4 rounded-xl border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs font-medium text-muted-foreground"
                  >
                     + Other account type
                  </button>
               </div>
            ) : (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                     <div className={cn("size-10 rounded-lg flex items-center justify-center", accountTypes.find(t => t.id === selectedType)?.color)}>
                        {accountTypes.find(t => t.id === selectedType)?.icon ? <RiCheckLine /> : <RiCheckLine />}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Adding</span>
                        <span className="font-bold">{accountTypes.find(t => t.id === selectedType)?.label || "Other Account"}</span>
                     </div>
                     <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} className="ml-auto text-xs">Change</Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label htmlFor="acc-name">Account name (optional)</Label>
                       <Input 
                         id="acc-name" 
                         placeholder="e.g. My MoMo" 
                         value={accountName}
                         onChange={(e) => setAccountName(e.target.value)}
                         className="h-12 rounded-xl"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="balance">Current balance (estimate is fine)</Label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">{currency}</span>
                          <Input 
                            id="balance" 
                            type="number"
                            placeholder="0.00" 
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="h-12 pl-14 text-xl font-bold rounded-xl"
                          />
                       </div>
                    </div>
                  </div>

                  <Button onClick={handleAdd} disabled={!balance} className="w-full h-14 rounded-xl text-lg gap-2 shadow-xl shadow-primary/20">
                     Add account
                     <RiAddLine size={20} />
                  </Button>
               </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <div className="space-y-3">
                {accounts.map((acc, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3">
                         <RiCheckLine className="text-primary size-5" />
                         <span className="font-medium text-sm">{acc.name}</span>
                      </div>
                      <span className="font-bold">{currency} {acc.balance.toLocaleString()}</span>
                   </div>
                ))}
             </div>

             <div className="py-4 space-y-4">
                <p className="text-center text-xs text-muted-foreground font-medium">Do you have other accounts?</p>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" onClick={() => setIsAdding(true)} className="h-12 rounded-xl text-xs gap-2 border-dashed">
                      <RiBankLine size={16} /> Add Bank
                   </Button>
                   <Button variant="outline" onClick={() => setIsAdding(true)} className="h-12 rounded-xl text-xs gap-2 border-dashed">
                      <RiSmartphoneLine size={16} /> Add Wallet
                   </Button>
                </div>
             </div>

             <Button onClick={handleNext} variant="secondary" className="w-full h-14 rounded-xl text-lg gap-2 group">
                I'll add more later
                <RiArrowRightLine size={20} className="transition-transform group-hover:translate-x-1" />
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

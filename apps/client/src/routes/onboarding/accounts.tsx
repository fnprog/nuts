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
    { id: "mtn", label: "MTN MoMo", icon: RiSmartphoneLine, color: "bg-yellow-400/10 text-yellow-600 border-yellow-400/25" },
    { id: "telecel", label: "Vodafone Cash", icon: RiSmartphoneLine, color: "bg-red-500/10 text-red-600 border-red-500/25" },
    { id: "bank", label: "Bank Account", icon: RiBankLine, color: "bg-blue-500/10 text-blue-600 border-blue-500/25" },
    { id: "cash", label: "Cash", icon: RiCoinsLine, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  ];

  const handleAdd = () => {
    if (selectedType && balance) {
      const typeLabel = accountTypes.find((t) => t.id === selectedType)?.label || "Other";
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

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex w-full flex-col gap-5 pt-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Where does your money live?</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {accounts.length === 0 ? "Let's start with your main account. You can add more in a moment." : "Great start! Your net worth is taking shape."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {!selectedType ? (
              <div className="grid grid-cols-2 gap-2">
                {accountTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md text-left",
                      type.color
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-current/10">
                      <type.icon size={16} />
                    </div>
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedType("other")}
                  className="border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground col-span-2 w-full rounded-xl border border-dashed p-2.5 text-xs font-medium transition-colors"
                >
                  + Other account type
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-muted/30 border-border/50 flex items-center gap-3 rounded-xl border p-3">
                  <div className={cn("size-8 rounded-lg flex items-center justify-center", accountTypes.find((t) => t.id === selectedType)?.color)}>
                    {(() => {
                      const T = accountTypes.find((t) => t.id === selectedType);
                      return T ? <T.icon size={16} /> : null;
                    })()}
                  </div>
                  <div>
                    <span className="text-muted-foreground/50 text-[10px]">Adding</span>
                    <p className="font-semibold">{accountTypes.find((t) => t.id === selectedType)?.label || "Other Account"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} className="text-muted-foreground ml-auto h-7 gap-1 text-xs">
                    Change
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-name" className="text-xs">
                      Account name (optional)
                    </Label>
                    <Input
                      id="acc-name"
                      placeholder="e.g. My MoMo"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="balance" className="text-xs">
                      Current balance (estimate is fine)
                    </Label>
                    <div className="relative">
                      <span className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold">{currency}</span>
                      <Input
                        id="balance"
                        type="number"
                        placeholder="0.00"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        className="h-11 rounded-lg pl-12 text-lg font-bold"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleAdd} disabled={!balance} className="shadow-primary/15 h-11 w-full gap-2 rounded-xl shadow-lg">
                  Add account
                  <RiAddLine size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="space-y-2">
              {accounts.map((acc, idx) => (
                <div key={idx} className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-xl border px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <RiCheckLine className="text-primary size-4 shrink-0" />
                    <span className="text-sm font-medium">{acc.name}</span>
                  </div>
                  <span className="text-sm font-bold">
                    {currency} {acc.balance.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <p className="text-muted-foreground text-center text-[11px] font-medium">Do you have other accounts?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setIsAdding(true)} className="h-10 gap-1.5 rounded-xl border-dashed text-xs">
                  <RiBankLine size={14} /> Add Bank
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(true)} className="h-10 gap-1.5 rounded-xl border-dashed text-xs">
                  <RiSmartphoneLine size={14} /> Add Wallet
                </Button>
              </div>
            </div>

            <Button onClick={() => navigate({ to: "/onboarding/income" })} variant="secondary" className="group h-14 w-full gap-2 rounded-xl text-lg">
              I'll add more later
              <RiArrowRightLine size={20} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

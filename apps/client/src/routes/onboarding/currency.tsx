import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { H1, Muted } from "@/core/components/ui/typography";
import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@nuts/constants";
import { Input } from "@/core/components/ui/input";

export const Route = createFileRoute("/onboarding/currency")({
  component: RouteComponent,
});

const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "BRL"];

function RouteComponent() {
  const navigate = useNavigate();
  const storedCurrency = useOnboardingStore((state) => state.currency);
  const setCurrency = useOnboardingStore((state) => state.setCurrency);
  const setStep = useOnboardingStore((state) => state.setStep);

  const [selectedCurrency, setSelectedCurrency] = useState(storedCurrency);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCurrencies = searchQuery
    ? CURRENCIES.filter(
        (currency) =>
          currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          currency.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CURRENCIES.filter((currency) => POPULAR_CURRENCIES.includes(currency.code));

  const handleContinue = async () => {
    setCurrency(selectedCurrency);
    setStep(3);
    await navigate({ to: "/onboarding/finance-interest" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[calc(100vh-200px)] flex-col w-full max-w-md"
    >
      <div className="flex-1 space-y-8">
        <div className="space-y-3 text-center">
          <H1 className="text-3xl font-semibold">Choose your currency</H1>
          <Muted className="text-base">Select your preferred currency for financial tracking</Muted>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Input
            placeholder="Search currencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setSelectedCurrency(currency.code)}
                className={cn(
                  "w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between",
                  selectedCurrency === currency.code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold">{currency.symbol}</span>
                  <div>
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs text-muted-foreground">{currency.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!searchQuery && (
            <Muted className="text-xs text-center">Showing popular currencies. Search to see all.</Muted>
          )}
        </motion.div>

        <Button
          variant="primary"
          onClick={handleContinue}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { TransactionFilters, type TransactionFilterState } from "./transaction-filters";

export function FilterDemo() {
  const [filters, setFilters] = useState<TransactionFilterState>({});

  const handleFiltersChange = (newFilters: TransactionFilterState) => {
    setFilters(newFilters);
  };

  const handleClearAll = () => {
    setFilters({});
  };

  return (
    <div className="max-w-md p-6">
      <h2 className="mb-4 text-lg font-semibold">Transaction Filters Demo</h2>
      <TransactionFilters filters={filters} onFiltersChange={handleFiltersChange} onClearAll={handleClearAll} />

      <div className="mt-6 rounded-md bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">Current Filters:</h3>
        <pre className="text-sm text-gray-600">{JSON.stringify(filters, null, 2)}</pre>
      </div>
    </div>
  );
}

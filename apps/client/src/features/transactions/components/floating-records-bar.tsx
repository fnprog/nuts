import { memo } from "react";
import { Button } from "@/core/components/ui/button";
import { Pencil, Trash2, Check } from "lucide-react";

interface FloatingActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const FloatingActionBar = memo(({ selectedCount, onClear, onEdit, onDelete, isDeleting = false }: FloatingActionBarProps) => {
  if (selectedCount === 0) return null;

  const transactionText = `transaction${selectedCount > 1 ? "s" : ""} selected`;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center justify-between gap-4 rounded-full bg-gray-900 px-4 py-2 text-white shadow-lg">
        {/* Left side: Selection Info */}
        <div className="flex items-center gap-3">
          {/* This button now calls onClear when clicked */}
          <button onClick={onClear} aria-label="Clear selection" className="flex-shrink-0 rounded-md bg-white p-1 transition-colors hover:bg-gray-200">
            <Check className="h-4 w-4 text-black" />
          </button>
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} {transactionText}
          </span>
        </div>

        {/* Right side: Action Icons */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit selected" className="text-gray-400 hover:bg-white/10 hover:text-white">
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete selected"
            className="text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

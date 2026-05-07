import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionService } from "./transaction.service";
import { crdtService } from "@/core/sync/crdt";
import { transactionQueryKeys } from "./transaction.keys";

interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

const UndoRedoContext = createContext<UndoRedoState>({
  canUndo: false,
  canRedo: false,
  undo: async () => {},
  redo: async () => {},
});

/**
 * Provides undo/redo capability to the transactions subtree.
 * Mount this once, wrapping the RecordsTable.
 */
export function UndoRedoProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Refreshes stack depth from the CRDT service.
  const syncDepth = useCallback(() => {
    const { canUndo: u, canRedo: r } = crdtService.getUndoRedoDepth();
    setCanUndo(u);
    setCanRedo(r);
  }, []);

  // Listen to query cache events — after every successful mutation the cache
  // is invalidated, which is the cheapest "mutation happened" signal we have.
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      syncDepth();
    });
    return unsubscribe;
  }, [queryClient, syncDepth]);

  const undo = useCallback(async () => {
    const result = await transactionService.undoTransaction();
    if (result.isErr()) {
      toast.error("Undo failed", { description: result.error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
    syncDepth();
    toast.success("Undone");
  }, [queryClient, syncDepth]);

  const redo = useCallback(async () => {
    const result = await transactionService.redoTransaction();
    if (result.isErr()) {
      toast.error("Redo failed", { description: result.error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
    syncDepth();
    toast.success("Redone");
  }, [queryClient, syncDepth]);

  // Global keyboard shortcut: Ctrl+Z / Ctrl+Shift+Z (or Cmd on Mac)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return <UndoRedoContext.Provider value={{ canUndo, canRedo, undo, redo }}>{children}</UndoRedoContext.Provider>;
}

export const useUndoRedo = () => useContext(UndoRedoContext);

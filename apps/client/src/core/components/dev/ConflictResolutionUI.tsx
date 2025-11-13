/**
 * Conflict Resolution UI Component
 *
 * Displays sync conflicts and provides resolution options for users.
 * This is a basic implementation for Phase 3.
 */

import { useState, useEffect } from "react";
import { syncService, type SyncConflict } from "../../sync/sync";
import { featureFlagsService } from "../../sync/feature-flags";
import { X, AlertTriangle, Check, RefreshCw } from "lucide-react";

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SyncConflict[];
}

export function ConflictResolutionDialog({ isOpen, onClose, conflicts }: ConflictResolutionDialogProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  if (!isOpen || conflicts.length === 0) return null;

  const handleResolveConflict = async (conflictId: string, resolution: "local" | "server" | "merge") => {
    setResolving(conflictId);
    const result = await syncService.resolveConflict(conflictId, resolution);
    if (result.isOk()) {
      console.log(`Resolved conflict ${conflictId} with ${resolution} version`);
    } else {
      console.error("Failed to resolve conflict:", result.error);
    }
    setResolving(null);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConflictTitle = (conflict: SyncConflict) => {
    const type = conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1);
    const name = conflict.localVersion?.name || conflict.serverVersion?.name || "Unknown";
    return `${type}: ${name}`;
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Sync Conflicts ({conflicts.length})</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{getConflictTitle(conflict)}</h3>
                  <span className="text-sm text-gray-500">{formatTimestamp(conflict.timestamp)}</span>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Local Version */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <h4 className="mb-2 font-medium text-blue-900">Your Local Version</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      {conflict.localVersion?.name && (
                        <div>
                          <span className="font-medium">Name:</span> {conflict.localVersion.name}
                        </div>
                      )}
                      {conflict.localVersion?.amount && (
                        <div>
                          <span className="font-medium">Amount:</span> ${conflict.localVersion.amount}
                        </div>
                      )}
                      {conflict.localVersion?.updated_at && (
                        <div>
                          <span className="font-medium">Updated:</span> {formatTimestamp(new Date(conflict.localVersion.updated_at))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Server Version */}
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <h4 className="mb-2 font-medium text-green-900">Server Version</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      {conflict.serverVersion?.name && (
                        <div>
                          <span className="font-medium">Name:</span> {conflict.serverVersion.name}
                        </div>
                      )}
                      {conflict.serverVersion?.amount && (
                        <div>
                          <span className="font-medium">Amount:</span> ${conflict.serverVersion.amount}
                        </div>
                      )}
                      {conflict.serverVersion?.updated_at && (
                        <div>
                          <span className="font-medium">Updated:</span> {formatTimestamp(new Date(conflict.serverVersion.updated_at))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleResolveConflict(conflict.id, "local")}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolving === conflict.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Keep Local
                  </button>

                  <button
                    onClick={() => handleResolveConflict(conflict.id, "server")}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolving === conflict.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Use Server
                  </button>

                  <button
                    onClick={() => handleResolveConflict(conflict.id, "merge")}
                    disabled={resolving === conflict.id}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolving === conflict.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Auto-Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConflictResolutionIndicator() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Only show if sync is enabled
    if (!featureFlagsService.isSyncEnabled()) return;

    const updateConflicts = () => {
      const currentConflicts = syncService.getConflicts();
      setConflicts(currentConflicts);
    };

    // Initial load
    updateConflicts();

    // Listen for sync state changes
    const unsubscribe = syncService.subscribe(() => {
      updateConflicts();
    });

    return unsubscribe;
  }, []);

  if (conflicts.length === 0) return null;

  return (
    <>
      <div className="fixed right-4 bottom-20 z-40">
        <button
          onClick={() => setShowDialog(true)}
          className="flex animate-pulse items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white shadow-lg transition-colors hover:bg-orange-600"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            {conflicts.length} Sync Conflict{conflicts.length > 1 ? "s" : ""}
          </span>
        </button>
      </div>

      <ConflictResolutionDialog isOpen={showDialog} onClose={() => setShowDialog(false)} conflicts={conflicts} />
    </>
  );
}

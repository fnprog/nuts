import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/core/components/ui/dialog-sheet";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { RiFolderLine } from "@remixicon/react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderCreated?: (folderName: string) => void;
  parentFolderId?: string | null;
}

export function CreateFolderDialog({ open, onOpenChange, onFolderCreated, parentFolderId = null }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    if (folderName.includes("/") || folderName.includes("\\")) {
      setError("Folder name cannot contain / or \\");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onFolderCreated) {
        onFolderCreated(folderName.trim());
      }

      setFolderName("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFolderName("");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RiFolderLine className="h-5 w-5" />
            Create New Folder
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                }
              }}
              disabled={isCreating}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !folderName.trim()}>
            {isCreating ? "Creating..." : "Create Folder"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

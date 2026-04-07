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
import { RiEditLine } from "@remixicon/react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename?: (newName: string) => void;
  currentName: string;
  itemType: "file" | "folder";
}

export function RenameDialog({ open, onOpenChange, onRename, currentName, itemType }: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }

    if (newName.includes("/") || newName.includes("\\")) {
      setError("Name cannot contain / or \\");
      return;
    }

    if (newName === currentName) {
      onOpenChange(false);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onRename) {
        onRename(newName.trim());
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleClose = () => {
    if (!isRenaming) {
      setNewName(currentName);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RiEditLine className="h-5 w-5" />
            Rename {itemType === "folder" ? "Folder" : "File"}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              placeholder="Enter new name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRenaming) {
                  handleRename();
                }
              }}
              disabled={isRenaming}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRenaming}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
            {isRenaming ? "Renaming..." : "Rename"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/core/components/ui/dialog-sheet";
import { RiDeleteBinLine, RiAlertLine } from "@remixicon/react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  itemName: string;
  itemType: "file" | "folder";
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, itemName, itemType }: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (onConfirm) {
        onConfirm();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-destructive">
            <RiAlertLine className="h-5 w-5" />
            Delete {itemType === "folder" ? "Folder" : "File"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{itemName}</span>?
            {itemType === "folder" && " All files and subfolders inside will also be deleted."} This action cannot be
            undone.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            <RiDeleteBinLine className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

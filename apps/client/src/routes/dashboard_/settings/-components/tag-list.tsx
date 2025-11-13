import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import IconPicker from "@/core/components/ui/icon-picker";
import { renderIcon } from "@/core/components/ui/icon-picker/index.helper";
import { MoreHorizontal, Pencil, Trash, AlertCircle } from "lucide-react";
import { crdtService } from "@/core/sync/crdt";
import { useTagsQuery, useUpdateTagMutation, useDeleteTagMutation } from "@/features/preferences/services/settings.queries";
import { logger } from "@/lib/logger";

export function TagList() {
  const { data: tags, isLoading, error } = useTagsQuery();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();

  const [editingTag, setEditingTag] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);

  const refreshTags = () => {
    const allTags = crdtService.getTags();
    setTags(allTags);
  };

  useEffect(() => {
    refreshTags();
  }, []);

  const tagList = useMemo(() => {
    return Object.values(tags).sort((a, b) => a.name.localeCompare(b.name));
  }, [tags]);

  const handleUpdate = async () => {
    if (editingTag) {
      try {
        setIsUpdating(true);
        const updateResult = await crdtService.updateTag(editingTag.id, {
          name: editingTag.name,
          icon: editingTag.icon,
        });
        if (updateResult.isErr()) {
          throw new Error(updateResult.error.message);
        }
        refreshTags();
        setEditingTag(null);
      } catch (error) {
        logger.error(error)
      }
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteTagMutation.mutateAsync(tagId);
    } catch (error) {
      logger.error(error)
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tagList.length > 0 ? (
            tagList.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {renderIcon(tag.icon, { className: "h-4 w-4 shrink-0" })}
                    {tag.name}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTag(tag)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(tag.id)}
                        disabled={deleteTagMutation.isPending}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground py-8 text-center">
                No tags found. Create your first tag to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingTag?.name ?? ""}
                onChange={(e) => setEditingTag(editingTag ? { ...editingTag, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={editingTag?.icon ?? ""}
                onChange={(icon) => setEditingTag(editingTag ? { ...editingTag, icon } : null)}
              />
            </div>
            <Button
              onClick={handleUpdate}
              className="w-full"
              disabled={!editingTag?.name || !editingTag?.icon || updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

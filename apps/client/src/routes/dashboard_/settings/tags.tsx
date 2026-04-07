import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { toast } from "sonner";
import IconPicker from "@/core/components/ui/icon-picker";
import { TagList } from "@/routes/dashboard_/settings/-components/tag-list";
import { useCreateTagMutation } from "@/features/preferences/services/settings.queries";
import { H3 } from "@/core/components/ui/typography";

export const Route = createFileRoute("/dashboard_/settings/tags")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", icon: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.name && newTag.icon) {
      try {
        setIsSubmitting(true);
        const createResult = await crdtService.createTag({
          id: nanoid(),
          name: newTag.name,
          icon: newTag.icon,
        });
        if (createResult.isErr()) {
          throw new Error(createResult.error.message);
        }
        setNewTag({ name: "", icon: "" });
        setIsOpen(false);
      } catch (error) {
        logger.error(error)
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <H3 className="font-medium">Tags</H3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={newTag.icon}
                  onChange={(icon) => setNewTag({ ...newTag, icon })}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!newTag.name || !newTag.icon || createTagMutation.isPending}
              >
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <TagList />
    </div>
  );
}

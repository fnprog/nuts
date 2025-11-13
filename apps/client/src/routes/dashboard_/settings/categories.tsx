import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { ColorPicker } from "@/core/components/ui/color-picker";
import IconPicker from "@/core/components/ui/icon-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useCreateSubcategoryMutation, useDeleteSubcategoryMutation } from "@/features/preferences/services/settings.queries";
import { renderIcon } from "@/core/components/ui/icon-picker/index.helper";
import { crdtService } from "@/core/sync/crdt";
import { type CRDTCategory } from "@nuts/types";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { H3, P, Small } from "@/core/components/ui/typography";

export const Route = createFileRoute("/dashboard_/settings/categories")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: categories, isLoading, error } = useCategoriesQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const createSubcategoryMutation = useCreateSubcategoryMutation();
  const deleteSubcategoryMutation = useDeleteSubcategoryMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    color: "#6b7280",
    type: "expense" as "expense" | "income",
    parent_id: undefined as string | undefined,
  });
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshCategories = () => {
    setCategories(crdtService.getCategories());
  };

  const categoryList = useMemo(() => {
    return Object.values(categories).filter((cat) => !cat.parent_id);
  }, [categories]);

  const getSubcategories = (parentId: string) => {
    return Object.values(categories).filter((cat) => cat.parent_id === parentId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name && newCategory.icon) {
      try {
        setIsSubmitting(true);
        const categoryId = nanoid();
        const createResult = await crdtService.createCategory({
          id: categoryId,
          name: newCategory.name.trim(),
          icon: newCategory.icon,
          color: newCategory.color || "#6b7280",
          type: newCategory.type,
          parent_id: newCategory.parent_id,
          is_active: true,
        });
        if (createResult.isErr()) {
          throw new Error(createResult.error.message);
        }
        setNewCategory({ name: "", icon: "", color: "#6b7280", type: "expense", parent_id: undefined });
        setIsOpen(false);
        refreshCategories();
        toast.success("Category created successfully");
      } catch (error) {
        toast.error("Failed to create category");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const subcategories = getSubcategories(categoryId);
      if (subcategories.length > 0) {
        toast.error("Cannot delete category with subcategories. Delete subcategories first.");
        return;
      }

      const deleteResult = await crdtService.deleteCategory(categoryId);
      if (deleteResult.isErr()) {
        throw new Error(deleteResult.error.message);
      }
      refreshCategories();
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleAddSubcategory = async (parentId: string) => {
    if (newSubcategoryName.trim()) {
      try {
        const parentCategory = categories[parentId];
        const subcategoryId = nanoid();
        const createResult = await crdtService.createCategory({
          id: subcategoryId,
          name: newSubcategoryName.trim(),
          parent_id: parentId,
          type: parentCategory.type,
          color: parentCategory.color,
          icon: parentCategory.icon,
          is_active: true,
        });
        if (createResult.isErr()) {
          throw new Error(createResult.error.message);
        }
        setNewSubcategoryName("");
        setAddingSubcategoryFor(null);
        refreshCategories();
        toast.success("Subcategory created");
      } catch (error) {
        toast.error("Failed to create subcategory");
      }
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      const deleteResult = await crdtService.deleteCategory(subcategoryId);
      if (deleteResult.isErr()) {
        throw new Error(deleteResult.error.message);
      }
      refreshCategories();
      toast.success("Subcategory deleted");
    } catch (error) {
      toast.error("Failed to delete subcategory");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <H3>Categories</H3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newCategory.type} onValueChange={(value: "expense" | "income") => setNewCategory({ ...newCategory, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker value={newCategory.icon} onChange={(icon) => setNewCategory({ ...newCategory, icon })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker
                  value={newCategory.color}
                  onChange={(color) => setNewCategory({ ...newCategory, color })}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!newCategory.name || !newCategory.icon || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Organize your transactions into categories and subcategories</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryList.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  {/* Main Category */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: category.color || "#6b7280" }}
                      />
                      {renderIcon(category.icon, { className: "h-5 w-5" })}
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({category.subcategories?.length || 0} subcategories)
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAddingSubcategoryFor(category.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Subcategory
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Subcategories - Tree style with indentation */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border-l-2 border-muted">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <span className="text-sm">{subcategory.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            disabled={deleteSubcategoryMutation.isPending}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAddingSubcategoryFor(category.id)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subcategory
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                  {/* Add subcategory form */ }
                  { addingSubcategoryFor === category.id && (
                  <div className="ml-6 flex gap-2">
                    <Input
                      placeholder="Subcategory name"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddSubcategory(category.id)}
                      disabled={!newSubcategoryName.trim() || createSubcategoryMutation.isPending}
                    >
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingSubcategoryFor(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
        ) : (
        <P variant="muted" className="py-8 text-center">
          No categories found. Create your first category to get started.
        </P>
          )}
      </CardContent>
    </Card>
    </div >
  );
}

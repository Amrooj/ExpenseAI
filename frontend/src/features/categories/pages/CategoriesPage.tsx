import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Category } from "@/types";
import { extractErrorMessage } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Must be a valid hex color"),
  icon: z.string().min(1, "Icon is required").max(10, "Icon too long"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b"
];

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: "#3b82f6", icon: "🏷️" },
  });

  const selectedColor = watch("color");

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({ name: category.name, color: category.color, icon: category.icon });
    } else {
      setEditingCategory(null);
      reset({ name: "", color: "#3b82f6", icon: "🏷️" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data });
        toast.success("Category updated successfully");
      } else {
        await createCategory.mutateAsync(data);
        toast.success("Category created successfully");
      }
      closeModal();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCategory.mutateAsync(deleteConfirm);
      toast.success("Category deleted successfully");
      setDeleteConfirm(null);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    }
  };

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Categories</h1>
          <p className="text-dark-muted mt-1">Manage how you classify your expenses.</p>
        </div>
        <Button onClick={() => openModal()} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      ) : !categories?.length ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          description="Create your first category to start organizing your expenses."
          action={{ label: "Create Category", onClick: () => openModal() }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-dark-surface border border-dark-border rounded-2xl p-5 hover:border-dark-muted/30 transition-all group relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"
                style={{ color: category.color }}
              />
              <div className="flex items-center justify-between mb-4 relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: `${category.color}20`, color: category.color, border: `1px solid ${category.color}40` }}
                >
                  {category.icon}
                </div>
                {!category.isDefault && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-dark-muted hover:text-primary-400" onClick={() => openModal(category)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-dark-muted hover:text-danger-400" onClick={() => setDeleteConfirm(category.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {category.isDefault && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-dark-elevated text-dark-muted border border-dark-border">
                    System
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white relative">{category.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <Input
              {...register("name")}
              label="Name"
              placeholder="e.g. Groceries"
              error={errors.name?.message}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register("icon")}
                label="Emoji Icon"
                placeholder="🛒"
                error={errors.icon?.message}
                disabled={isSubmitting}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Color</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg shrink-0 border border-dark-border shadow-inner" 
                    style={{ backgroundColor: selectedColor }} 
                  />
                  <Input
                    {...register("color")}
                    placeholder="#3b82f6"
                    className="flex-1"
                    error={errors.color?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Quick Colors</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-6 h-6 rounded-md border border-black/20 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface"
                    style={{ backgroundColor: c }}
                    onClick={() => setValue("color", c)}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="px-0 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. Any expenses associated with this category will be preserved but you won't be able to filter by it anymore unless you recreate it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

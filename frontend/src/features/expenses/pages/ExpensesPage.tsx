import { useState, useMemo, useRef, useEffect } from "react";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useSuggestCategory } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Filter, Trash2, Edit2, Loader2, Sparkles, Receipt, Calendar, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatCurrency, extractErrorMessage, debounce } from "@/lib/utils";
import { format } from "date-fns";
import type { Expense, ExpenseFilters, Category } from "@/types";

const INITIAL_FILTERS: ExpenseFilters = {
  page: 1,
  limit: 20,
  sortBy: "date",
  sortOrder: "desc",
};

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<ExpenseFilters>(INITIAL_FILTERS);
  const { data: expensesData, isLoading } = useExpenses(filters);
  const { data: categories } = useCategories();
  
  const deleteExpense = useDeleteExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearch = useMemo(
    () => debounce(((value: string) => setFilters(prev => ({ ...prev, search: value, page: 1 }))) as (...args: unknown[]) => void, 400),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const openModal = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteExpense.mutateAsync(deleteConfirm);
      toast.success("Expense deleted");
      setDeleteConfirm(null);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-dark-muted mt-1">Track and manage your spending.</p>
        </div>
        <Button onClick={() => openModal()} className="shrink-0 gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search expenses..."
            className="w-full pl-9 pr-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
          />
        </div>
        <Select
          value={filters.categoryId || "all"}
          onValueChange={(val) => setFilters(prev => ({ ...prev, categoryId: val === "all" ? undefined : val, page: 1 }))}
        >
          <SelectTrigger className="w-[160px] bg-dark-surface">
            <Filter className="w-4 h-4 mr-2 text-dark-muted" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-dark-surface border border-dark-border rounded-2xl overflow-hidden flex flex-col relative">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={8} />
          </div>
        ) : !expensesData?.expenses.length ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Receipt}
              title={filters.search || filters.categoryId ? "No results found" : "No expenses yet"}
              description={filters.search || filters.categoryId ? "Try adjusting your filters" : "Click 'Add Expense' to record your first transaction."}
              action={!filters.search && !filters.categoryId ? { label: "Add Expense", onClick: () => openModal() } : undefined}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-dark-elevated/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-3 font-medium text-dark-muted border-b border-dark-border">Date</th>
                  <th className="px-6 py-3 font-medium text-dark-muted border-b border-dark-border">Description</th>
                  <th className="px-6 py-3 font-medium text-dark-muted border-b border-dark-border">Category</th>
                  <th className="px-6 py-3 font-medium text-dark-muted border-b border-dark-border text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-dark-muted border-b border-dark-border w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {expensesData.expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-dark-elevated/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-dark-muted" />
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white max-w-[200px] sm:max-w-[300px] truncate">
                        {expense.description}
                      </p>
                      {expense.isRecurring && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-primary-400 font-medium">
                          <CalendarClock className="w-3 h-3" />
                          Recurring {expense.recurringInterval?.toLowerCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border" style={{ backgroundColor: `${expense.category.color}15`, borderColor: `${expense.category.color}30`, color: expense.category.color }}>
                        <span>{expense.category.icon}</span>
                        <span className="text-xs font-medium">{expense.category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-dark-muted hover:text-primary-400" onClick={() => openModal(expense)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-dark-muted hover:text-danger-400" onClick={() => setDeleteConfirm(expense.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {expensesData?.meta && expensesData.meta.totalPages > 1 && (
          <div className="p-4 border-t border-dark-border bg-dark-surface flex items-center justify-between shrink-0">
            <span className="text-sm text-dark-muted">
              Page {expensesData.meta.page} of {expensesData.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!expensesData.meta.hasPrevPage}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!expensesData.meta.hasNextPage}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        expense={editingExpense}
        categories={categories || []}
        userCurrency={user?.defaultCurrency || "USD"}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This expense will be permanently removed from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteExpense.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteExpense.isPending}>
              {deleteExpense.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Expense Modal Component ---

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  categories: Category[];
  userCurrency: string;
}

function ExpenseModal({ isOpen, onClose, expense, categories, userCurrency }: ExpenseModalProps) {
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const suggestCategory = useSuggestCategory();
  const isEditing = !!expense;

  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    categoryId: "",
    isRecurring: false,
    notes: "",
  });

  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; categoryName: string; confidence: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setForm({
          amount: String(expense.amount),
          description: expense.description,
          date: format(new Date(expense.date), "yyyy-MM-dd"),
          categoryId: expense.categoryId,
          isRecurring: expense.isRecurring,
          notes: expense.notes || "",
        });
      } else {
        setForm({
          amount: "",
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
          categoryId: categories[0]?.id || "",
          isRecurring: false,
          notes: "",
        });
      }
      setAiSuggestion(null);
    }
  }, [isOpen, expense, categories]);

  // AI Suggestion Effect
  useEffect(() => {
    if (!isOpen || isEditing) return;
    
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (form.description.length > 2 && parseFloat(form.amount) > 0) {
      debounceRef.current = setTimeout(() => {
        suggestCategory.mutate(
          { description: form.description, amount: parseFloat(form.amount) },
          {
            onSuccess: (data) => {
              if (data && data.categoryId !== form.categoryId) {
                setAiSuggestion(data);
              }
            }
          }
        );
      }, 500);
    } else {
      setAiSuggestion(null);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.description, form.amount, isOpen, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        amount: parseFloat(form.amount),
        currency: userCurrency,
        description: form.description,
        date: new Date(form.date).toISOString(),
        categoryId: form.categoryId,
        isRecurring: form.isRecurring,
        notes: form.notes,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: expense.id, data: payload });
        toast.success("Expense updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Expense added");
      }
      onClose();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Amount (${userCurrency})`}
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              disabled={isPending}
              autoFocus
            />
            <Input
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Input
              label="Description"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Weekly Groceries"
              disabled={isPending}
              rightElement={suggestCategory.isPending ? <Loader2 className="w-4 h-4 text-primary-500 animate-spin" /> : null}
            />
            
            {aiSuggestion && !suggestCategory.isPending && (
              <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm animate-in fade-in zoom-in duration-200">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <div className="flex-1">
                  <span className="text-violet-300 font-medium">AI suggests: </span>
                  <span className="text-white">{aiSuggestion.categoryName}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setForm(prev => ({ ...prev, categoryId: aiSuggestion.categoryId }));
                    setAiSuggestion(null);
                  }}
                  className="h-7 px-2 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-none"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Category *</label>
            <Select
              value={form.categoryId}
              onValueChange={(val) => {
                setForm({ ...form, categoryId: val });
                setAiSuggestion(null);
              }}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-dark-border bg-dark-elevated">
            <div>
              <p className="text-sm font-medium text-white">Recurring Expense</p>
              <p className="text-xs text-dark-muted">This expense repeats periodically</p>
            </div>
            <Switch
              checked={form.isRecurring}
              onCheckedChange={(c) => setForm({ ...form, isRecurring: c })}
              disabled={isPending}
            />
          </div>

          <Textarea
            label="Notes (Optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add any extra details here..."
            disabled={isPending}
            rows={2}
          />

          <DialogFooter className="px-0 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[100px]">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

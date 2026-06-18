// ============================================================
// src/features/expenses/pages/ExpensesPage.tsx — Expense Management
// ============================================================

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  useExpenses, useCategories, useDeleteExpense,
  useCreateExpense, useUpdateExpense, useSuggestCategory,
  useUploadReceipt,
} from "../../../hooks/useExpenses";
import { ExpenseFilters, Expense } from "../../../types";
import { useAuthStore } from "../../../store/authStore";

// ── Types ─────────────────────────────────────────────────────
interface AISuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

// ── Expense Modal (Add/Edit) ──────────────────────────────────
function ExpenseModal({
  isOpen, onClose, categories, expenseToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; icon: string; color: string }>;
  expenseToEdit?: Expense | null;
}) {
  const createExpense    = useCreateExpense();
  const updateExpense    = useUpdateExpense();
  const suggestCategory  = useSuggestCategory();
  const uploadReceipt    = useUploadReceipt();
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultForm = useMemo(() => ({
    description: "", amount: "", categoryId: "",
    date: new Date().toISOString().slice(0, 10), notes: "",
  }), []);

  const [form, setForm]             = useState(defaultForm);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset / pre-fill form when modal opens or expense changes
  useEffect(() => {
    if (isOpen) {
      setAiSuggestion(null);
      setSelectedFile(null);
      if (expenseToEdit) {
        setForm({
          description: expenseToEdit.description,
          amount:      expenseToEdit.amount.toString(),
          categoryId:  expenseToEdit.categoryId,
          date:        new Date(expenseToEdit.date).toISOString().slice(0, 10),
          notes:       expenseToEdit.notes || "",
        });
        setIsRecurring(expenseToEdit.isRecurring ?? false);
        setRecurringInterval(expenseToEdit.recurringInterval ?? "MONTHLY");
        setRecurringEndDate(expenseToEdit.recurringEndDate ? new Date(expenseToEdit.recurringEndDate).toISOString().slice(0, 10) : "");
      } else {
        setForm(defaultForm);
        setIsRecurring(false);
        setRecurringInterval("MONTHLY");
        setRecurringEndDate("");
      }
    } else {
      setTimeout(() => {
        setForm(defaultForm);
        setAiSuggestion(null);
        setIsRecurring(false);
        setRecurringInterval("MONTHLY");
        setRecurringEndDate("");
        setSelectedFile(null);
      }, 200);
    }
  }, [expenseToEdit, isOpen, defaultForm]);

  // AI debounced category suggestion on description change
  const triggerAISuggestion = useCallback((description: string, amount: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!description || description.length < 3) { setAiSuggestion(null); return; }
    debounceRef.current = setTimeout(() => {
      const parsedAmount = parseFloat(amount) || 0;
      suggestCategory.mutate(
        { description, amount: parsedAmount },
        {
          onSuccess: (data) => {
            if (data) setAiSuggestion(data as AISuggestion);
          },
        }
      );
    }, 400);
  }, [suggestCategory]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const isDirty = useMemo(() => {
    if (!expenseToEdit) return true;
    return (
      form.description !== expenseToEdit.description ||
      parseFloat(form.amount) !== expenseToEdit.amount ||
      form.categoryId !== expenseToEdit.categoryId ||
      form.date !== new Date(expenseToEdit.date).toISOString().slice(0, 10) ||
      form.notes !== (expenseToEdit.notes || "") ||
      isRecurring !== (expenseToEdit.isRecurring ?? false) ||
      (isRecurring && (
        recurringInterval !== (expenseToEdit.recurringInterval ?? "MONTHLY") ||
        recurringEndDate !== (expenseToEdit.recurringEndDate ? new Date(expenseToEdit.recurringEndDate).toISOString().slice(0, 10) : "")
      ))
    );
  }, [form, expenseToEdit, isRecurring, recurringInterval, recurringEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseToEdit && !isDirty && !selectedFile) { onClose(); return; }

    const payload = {
      description: form.description,
      amount:      parseFloat(form.amount),
      categoryId:  form.categoryId,
      date:        new Date(form.date).toISOString(),
      notes:       form.notes || undefined,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      recurringEndDate:  (isRecurring && recurringEndDate) ? new Date(recurringEndDate).toISOString() : undefined,
    };

    let savedExpense: Expense;
    if (expenseToEdit) {
      savedExpense = await updateExpense.mutateAsync({ id: expenseToEdit.id, updates: payload });
    } else {
      savedExpense = await createExpense.mutateAsync(payload);
    }

    if (selectedFile && savedExpense) {
      await uploadReceipt.mutateAsync({ expenseId: savedExpense.id, file: selectedFile });
    }

    setForm(defaultForm);
    setSelectedFile(null);
    onClose();
  };

  const isPending = createExpense.isPending || updateExpense.isPending || uploadReceipt.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {expenseToEdit ? "Edit Expense" : "Add Expense"}
          </h2>
          <button onClick={onClose} className="text-dark-muted hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm text-dark-text mb-1">
              Description
              {suggestCategory.isPending && (
                <span className="text-xs text-violet-400 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                  AI thinking…
                </span>
              )}
            </label>
            <input
              className="input-field"
              placeholder="What did you spend on?"
              required
              value={form.description}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => ({ ...prev, description: val }));
                triggerAISuggestion(val, form.amount);
              }}
            />
          </div>

          {/* AI Suggestion Banner */}
          {aiSuggestion && !suggestCategory.isPending && (
            <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm animate-fade-in">
              <span className="text-lg">🤖</span>
              <div className="flex-1 min-w-0">
                <span className="text-violet-300 font-medium">AI suggests: </span>
                <span className="text-white">{aiSuggestion.categoryName}</span>
                <span className="text-dark-muted ml-2">
                  ({Math.round(aiSuggestion.confidence * 100)}% confident)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, categoryId: aiSuggestion.categoryId }));
                  setAiSuggestion(null);
                }}
                className="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setAiSuggestion(null)}
                className="text-dark-muted hover:text-white text-lg leading-none"
                aria-label="Dismiss suggestion"
              >
                ×
              </button>
            </div>
          )}

          {/* Amount + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-text mb-1">Amount</label>
              <input
                className="input-field"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({ ...prev, amount: val }));
                  triggerAISuggestion(form.description, val);
                }}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-text mb-1">Date</label>
              <input
                className="input-field"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-dark-text mb-1">Category</label>
            <select
              className="input-field"
              required
              value={form.categoryId}
              onChange={(e) => {
                setForm(prev => ({ ...prev, categoryId: e.target.value }));
                setAiSuggestion(null);
              }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-dark-text mb-1">Notes (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Any additional details..."
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm text-dark-text mb-1">Receipt (optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
              className="input-field file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-300 file:text-xs file:cursor-pointer"
            />
            {expenseToEdit?.receiptUrl && !selectedFile && (
              <p className="text-xs text-emerald-400 mt-1">
                Current receipt: <a href={`http://localhost:3000${expenseToEdit.receiptUrl}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300">View file</a>
              </p>
            )}
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-border/20 rounded-xl">
            <div>
              <p className="text-sm font-medium text-dark-text">Recurring expense</p>
              <p className="text-xs text-dark-muted">Repeat this expense at intervals</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                isRecurring ? "bg-primary-500" : "bg-dark-border"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                isRecurring ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-dark-border/10 rounded-xl border border-dark-border/30 animate-fade-in">
              <div>
                <label className="block text-xs text-dark-muted mb-1">Interval</label>
                <select
                  className="input-field text-sm py-1.5"
                  value={recurringInterval}
                  onChange={(e) => setRecurringInterval(e.target.value as any)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-dark-muted mb-1">End Date (optional)</label>
                <input
                  type="date"
                  className="input-field text-sm py-1.5"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || (!!expenseToEdit && !isDirty && !selectedFile)}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {expenseToEdit ? "Saving…" : "Adding…"}
              </>
            ) : (
              expenseToEdit ? "Save Changes" : "Add Expense"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Expense Row ───────────────────────────────────────────────
function ExpenseRow({ expense, onEdit, onDelete, currency, isDeleting }: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  currency: string;
  isDeleting?: boolean;
}) {
  const fmt = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(n);

  return (
    <div className={`flex items-center gap-4 p-4 bg-dark-surface/50 border border-dark-border/50 rounded-xl hover:border-primary-500/30 transition-all group ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Category badge */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ backgroundColor: (expense.category?.color ?? "#6366F1") + "20" }}
      >
        {expense.category?.icon ?? "📦"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{expense.description}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-dark-muted">
            {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-border/50 text-dark-muted">
            {expense.category?.name ?? "Uncategorized"}
          </span>
          {expense.isRecurring && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
              🔄 Recurring
            </span>
          )}
          {expense.receiptUrl && (
            <span className="text-xs text-emerald-400">📎</span>
          )}
          {expense.aiProvider && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
              🤖 {Math.round((expense.aiConfidence ?? 0) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white">{fmt(expense.amount)}</p>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all flex-shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="text-dark-muted hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-400/10 transition-all"
          aria-label="Edit expense"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="text-dark-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
          aria-label="Delete expense"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Main Expenses Page ────────────────────────────────────────
export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [showModal, setShowModal]         = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters]             = useState<ExpenseFilters>({ page: 1, limit: 20 });
  const [search, setSearch]               = useState("");
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const { data, isLoading } = useExpenses({ ...filters, search: search || undefined });
  const { data: categories = [] } = useCategories();
  const deleteExpense = useDeleteExpense();

  const expenses = (data?.data ?? []) as Expense[];
  const meta     = data?.meta;

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    setDeletingId(id);
    deleteExpense.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }, [deleteExpense]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingExpense(null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Expenses</h1>
          <p className="text-dark-muted mt-1">
            {meta?.total != null ? `${meta.total} total expense${meta.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Add Expense
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm">🔍</span>
            <input
              className="input-field pl-10"
              placeholder="Search expenses…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            />
          </div>
          <select
            className="input-field w-full sm:w-48"
            value={filters.categoryId ?? ""}
            onChange={(e) => setFilters(f => ({ ...f, categoryId: e.target.value || undefined, page: 1 }))}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select
            className="input-field w-full sm:w-44"
            value={`${filters.sortBy ?? "date"}-${filters.sortOrder ?? "desc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [string, "asc" | "desc"];
              setFilters(f => ({ ...f, sortBy: sortBy as ExpenseFilters["sortBy"], sortOrder }));
            }}
            aria-label="Sort expenses"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>
        {/* Date range row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-dark-muted whitespace-nowrap">From</label>
            <input
              type="date"
              className="input-field flex-1 text-sm"
              value={filters.startDate?.slice(0,10) ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
              aria-label="Start date"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-dark-muted whitespace-nowrap">To</label>
            <input
              type="date"
              className="input-field flex-1 text-sm"
              value={filters.endDate?.slice(0,10) ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value + "T23:59:59.999Z").toISOString() : undefined, page: 1 }))}
              aria-label="End date"
            />
          </div>
          {(filters.startDate || filters.endDate || filters.categoryId || search) && (
            <button
              onClick={() => { setSearch(""); setFilters({ page: 1, limit: 20 }); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors whitespace-nowrap px-3 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Expense List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">{search || filters.categoryId ? "🔍" : "💸"}</p>
          <h3 className="text-xl font-semibold text-white">
            {search || filters.categoryId ? "No matching expenses" : "No expenses yet"}
          </h3>
          <p className="text-dark-muted mt-2 max-w-xs mx-auto">
            {search || filters.categoryId
              ? "Try adjusting your search or filters."
              : "Click \"Add Expense\" to start tracking your spending."}
          </p>
          {!search && !filters.categoryId && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6 px-6 py-2.5">
              + Add First Expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onEdit={setEditingExpense}
              onDelete={handleDelete}
              currency={user?.defaultCurrency ?? "USD"}
              isDeleting={deletingId === expense.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={!meta.hasPrevPage}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="px-4 py-2 text-sm rounded-lg border border-dark-border text-dark-muted hover:text-white hover:border-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <span className="text-sm text-dark-muted px-4">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={!meta.hasNextPage}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="px-4 py-2 text-sm rounded-lg border border-dark-border text-dark-muted hover:text-white hover:border-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <ExpenseModal
        isOpen={showModal || !!editingExpense}
        onClose={handleCloseModal}
        categories={categories}
        expenseToEdit={editingExpense}
      />
    </div>
  );
}

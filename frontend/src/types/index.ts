// ============================================================
// src/types/index.ts — Shared Frontend TypeScript Types
// ============================================================
//
// 🎓 TEACHING: Why mirror backend types on the frontend?
//
// In a monorepo setup, you'd share types between backend and frontend
// using a shared package (e.g., @expense-tracker/types).
//
// In our setup, we duplicate the core types on the frontend.
// This is acceptable for now — in a larger project, extract them
// to a shared package to eliminate duplication.
// ============================================================

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  timezone: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ── Category ──────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  userId: string | null;
}

// ── Expense ───────────────────────────────────────────────────
export type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type AIProvider = "GEMINI" | "RULE_BASED";

export interface Expense {
  id: string;
  userId: string;
  amount: number;   // Frontend works with numbers (Prisma Decimal → number in JSON)
  currency: string;
  description: string;
  date: string;     // ISO string from API
  categoryId: string;
  category: Category;
  tags: string[];
  receiptUrl: string | null;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  recurringEndDate: string | null;
  aiConfidence: number | null;
  aiProvider: AIProvider | null;
  aiOverridden: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  amount: number;
  currency?: string;
  description: string;
  date: string;
  categoryId: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: string;
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  aiOverridden?: boolean;
}

// ── Budget ────────────────────────────────────────────────────
export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  month: string;
  currency: string;
}

// ── Analytics ─────────────────────────────────────────────────
export interface MonthlySummary {
  totalSpent: number;
  totalExpenses: number;
  averageExpense: number;
  topCategory: Category | null;
  currency: string;
  month: string;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface SpendingTrend {
  date: string;
  total: number;
}

// ── Filter & Sort ─────────────────────────────────────────────
export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  isRecurring?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "date" | "amount" | "description";
  sortOrder?: "asc" | "desc";
}

// ── Theme ─────────────────────────────────────────────────────
export type Theme = "dark" | "light";

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

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  userId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type AIProvider = "GEMINI" | "RULE_BASED";

export interface Expense {
  id: string;
  userId: string;
  amount: number | string;
  currency: string;
  description: string;
  date: string;
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

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  month: string;
  currency: string;
}

export interface DashboardData {
  thisMonth: { total: number; count: number; average: number };
  lastMonth: { total: number };
  changePercent: number;
  totalExpenses: number;
}

export interface TrendsData {
  monthly: Array<{ month: string; total: number }>;
  byCategory: Array<{ categoryId: string; _sum: { amount: number }; _count: number }>;
}

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
  sortBy?: "date" | "amount" | "description" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  provider: string;
  requiresConfirmation: boolean;
}

export type Theme = "dark" | "light";

// ============================================================
// tests/unit/expense.service.test.ts — Expense Service Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as expenseService from "../../src/services/expense.service";

vi.mock("../../src/repositories/expense.repository");
vi.mock("../../src/repositories/category.repository");
vi.mock("../../src/ai/AICategorizerService");

import * as expenseRepo  from "../../src/repositories/expense.repository";
import * as categoryRepo from "../../src/repositories/category.repository";
import * as aiService    from "../../src/ai/AICategorizerService";

// ── Shared Fixtures ───────────────────────────────────────────
const mockCategory = {
  id: "cat_123", name: "Food & Dining", color: "#FF6B6B",
  icon: "🍕", isDefault: true, userId: null,
};

const mockExpense = {
  id: "exp_123", userId: "user_123", amount: 25.00,
  currency: "USD", description: "Pizza dinner", date: new Date().toISOString(),
  categoryId: "cat_123", category: mockCategory,
  tags: [], receiptUrl: null, isRecurring: false,
  recurringInterval: null, recurringEndDate: null, recurringParentId: null,
  aiConfidence: 0.9, aiProvider: "RULE_BASED", aiOverridden: false,
  notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe("ExpenseService.createExpense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryRepo.findCategoryById).mockResolvedValue(mockCategory);
    vi.mocked(expenseRepo.createExpense).mockResolvedValue(mockExpense as never);
    vi.mocked(aiService.categorizeExpense).mockResolvedValue({
      categoryId: "cat_123", categoryName: "Food & Dining",
      confidence: 0.9, provider: "RULE_BASED", requiresConfirmation: false,
    });
  });

  it("should create an expense successfully", async () => {
    const dto = {
      amount: 25.00, description: "Pizza dinner",
      date: new Date().toISOString(), categoryId: "cat_123",
      tags: [], isRecurring: false,
    };

    const result = await expenseService.createExpense("user_123", dto);

    expect(result).toBeDefined();
    expect(expenseRepo.createExpense).toHaveBeenCalledWith(
      "user_123",
      expect.objectContaining({ description: "Pizza dinner", amount: 25.00 })
    );
  });

  it("should throw 400 if category does not exist", async () => {
    vi.mocked(categoryRepo.findCategoryById).mockResolvedValue(null);

    await expect(
      expenseService.createExpense("user_123", {
        amount: 25, description: "test", date: new Date().toISOString(),
        categoryId: "invalid_id", tags: [], isRecurring: false,
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(expenseRepo.createExpense).not.toHaveBeenCalled();
  });

  it("should still create expense even if AI categorization fails", async () => {
    vi.mocked(aiService.categorizeExpense).mockRejectedValue(new Error("AI down"));

    const result = await expenseService.createExpense("user_123", {
      amount: 10, description: "Coffee", date: new Date().toISOString(),
      categoryId: "cat_123", tags: [], isRecurring: false,
    });

    // Expense created despite AI failure
    expect(result).toBeDefined();
    expect(expenseRepo.createExpense).toHaveBeenCalled();
  });
});

describe("ExpenseService.deleteExpense", () => {
  it("should throw 404 if expense not found or not owned by user", async () => {
    vi.mocked(expenseRepo.deleteExpense).mockResolvedValue(false);

    await expect(
      expenseService.deleteExpense("nonexistent", "user_123")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should delete successfully when expense is owned by user", async () => {
    vi.mocked(expenseRepo.deleteExpense).mockResolvedValue(true);

    await expect(
      expenseService.deleteExpense("exp_123", "user_123")
    ).resolves.toBeUndefined();
  });
});

describe("ExpenseService.suggestCategory", () => {
  it("should return null for very short descriptions", async () => {
    const result = await expenseService.suggestCategory("ab", 10, "user_123");
    expect(result).toBeNull();
    expect(aiService.categorizeExpense).not.toHaveBeenCalled();
  });

  it("should return AI suggestion for valid descriptions", async () => {
    vi.mocked(aiService.categorizeExpense).mockResolvedValue({
      categoryId: "cat_123", categoryName: "Food & Dining",
      confidence: 0.9, provider: "RULE_BASED", requiresConfirmation: false,
    });

    const result = await expenseService.suggestCategory("Pizza from Dominos", 15, "user_123");
    expect(result?.categoryName).toBe("Food & Dining");
  });
});

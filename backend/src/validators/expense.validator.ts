// ============================================================
// src/validators/expense.validator.ts — Expense Zod Schemas
// ============================================================

import { z } from "zod";

// ── Reusable field definitions ────────────────────────────────
const amountSchema = z
  .number({ required_error: "Amount is required" })
  .positive("Amount must be a positive number")
  .multipleOf(0.01, "Amount can have at most 2 decimal places")
  .max(9_999_999_999.99, "Amount exceeds maximum allowed value");

const dateSchema = z
  .string({ required_error: "Date is required" })
  .datetime({ message: "Date must be a valid ISO 8601 datetime string" });

const currencySchema = z
  .string()
  .length(3, "Currency must be a 3-letter ISO code (e.g. USD, EUR, INR)")
  .toUpperCase()
  .optional();

const recurringIntervalSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], {
  errorMap: () => ({ message: "Interval must be DAILY, WEEKLY, MONTHLY, or YEARLY" }),
});

// ── Create Expense Schema ─────────────────────────────────────
export const createExpenseSchema = z.object({
  body: z
    .object({
      amount:      amountSchema,
      currency:    currencySchema,
      description: z
        .string({ required_error: "Description is required" })
        .trim()
        .min(1, "Description cannot be empty")
        .max(500, "Description cannot exceed 500 characters"),
      date:        dateSchema,
      categoryId:  z
        .string({ required_error: "Category is required" })
        .cuid("Invalid category ID"),
      tags: z
        .array(z.string().trim().max(50))
        .max(10, "Maximum 10 tags allowed")
        .optional()
        .default([]),
      notes: z
        .string()
        .trim()
        .max(1000, "Notes cannot exceed 1000 characters")
        .optional(),

      // Recurring fields
      isRecurring:      z.boolean().optional().default(false),
      recurringInterval: recurringIntervalSchema.optional(),
      recurringEndDate:  z.string().datetime().optional(),
    })
    .refine(
      (data) => !data.isRecurring || data.recurringInterval !== undefined,
      {
        message: "recurringInterval is required when isRecurring is true",
        path: ["recurringInterval"],
      }
    )
    .refine(
      (data) =>
        !data.recurringEndDate ||
        new Date(data.recurringEndDate) > new Date(data.date),
      {
        message: "recurringEndDate must be after the expense date",
        path: ["recurringEndDate"],
      }
    ),
});

// ── Update Expense Schema (all fields optional) ───────────────
export const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid expense ID"),
  }),
  body: z.object({
    amount:           amountSchema.optional(),
    currency:         currencySchema,
    description:      z.string().trim().min(1).max(500).optional(),
    date:             dateSchema.optional(),
    categoryId:       z.string().cuid("Invalid category ID").optional(),
    tags:             z.array(z.string().trim().max(50)).max(10).optional(),
    notes:            z.string().trim().max(1000).optional().nullable(),
    isRecurring:      z.boolean().optional(),
    recurringInterval: recurringIntervalSchema.optional().nullable(),
    recurringEndDate: z.string().datetime().optional().nullable(),
    aiOverridden:     z.boolean().optional(),
  }),
});

// ── Single Expense Param Schema ───────────────────────────────
export const expenseIdSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid expense ID"),
  }),
});

// ── List/Filter Schema ────────────────────────────────────────
export const listExpensesSchema = z.object({
  query: z.object({
    page:        z.coerce.number().int().positive().optional().default(1),
    limit:       z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy:      z.enum(["date", "amount", "description", "createdAt"]).optional().default("date"),
    sortOrder:   z.enum(["asc", "desc"]).optional().default("desc"),
    search:      z.string().trim().optional(),
    categoryId:  z.string().cuid().optional(),
    startDate:   z.string().datetime().optional(),
    endDate:     z.string().datetime().optional(),
    minAmount:   z.coerce.number().positive().optional(),
    maxAmount:   z.coerce.number().positive().optional(),
    isRecurring: z.coerce.boolean().optional(),
    tags:        z.string().optional(), // comma-separated: "food,travel"
  }),
});

// ── CSV Import Schema ─────────────────────────────────────────
export const csvRowSchema = z.object({
  amount:      z.coerce.number().positive(),
  description: z.string().trim().min(1),
  date:        z.string(),
  category:    z.string().trim().min(1),
  currency:    z.string().length(3).toUpperCase().optional(),
  tags:        z.string().optional(),
  notes:       z.string().optional(),
});

// ── TypeScript Types ──────────────────────────────────────────
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>["body"];
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>["body"];
export type ListExpensesQuery = z.infer<typeof listExpensesSchema>["query"];
export type CsvRowDto = z.infer<typeof csvRowSchema>;

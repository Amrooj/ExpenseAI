// ============================================================
// src/validators/category.validator.ts
// ============================================================

import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name:  z.string().trim().min(1).max(50, "Category name cannot exceed 50 characters"),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g. #FF6B6B)")
      .optional()
      .default("#6366F1"),
    icon:  z.string().trim().min(1).max(10).optional().default("📦"),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body:   z.object({
    name:  z.string().trim().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon:  z.string().trim().min(1).max(10).optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: z.string().cuid("Invalid category ID") }),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>["body"];

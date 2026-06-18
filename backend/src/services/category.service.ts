// ============================================================
// src/services/category.service.ts
// ============================================================

import * as categoryRepo from "../repositories/category.repository";
import { createError }   from "../middleware/errorHandler";
import { CreateCategoryDto, UpdateCategoryDto } from "../validators/category.validator";

export async function listCategories(userId: string) {
  return categoryRepo.findCategoriesForUser(userId);
}

export async function createCategory(userId: string, dto: CreateCategoryDto) {
  // Check for duplicate name (case-insensitive)
  const existing = await categoryRepo.findCategoryByName(dto.name, userId);
  if (existing) {
    throw createError.conflict(
      `A category named "${dto.name}" already exists.`
    );
  }
  return categoryRepo.createCategory(userId, dto);
}

export async function updateCategory(
  id:     string,
  userId: string,
  dto:    UpdateCategoryDto
) {
  const updated = await categoryRepo.updateCategory(id, userId, dto);
  if (!updated) {
    throw createError.notFound("Category");
  }
  return updated;
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const deleted = await categoryRepo.deleteCategory(id, userId);
  if (!deleted) {
    // Could be a system category (userId = null) or doesn't exist
    const exists = await categoryRepo.findCategoryById(id, userId);
    if (exists?.isDefault) {
      throw createError.forbidden("System default categories cannot be deleted.");
    }
    throw createError.notFound("Category");
  }
}

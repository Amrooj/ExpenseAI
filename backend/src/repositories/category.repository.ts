// ============================================================
// src/repositories/category.repository.ts
// ============================================================

import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

// Get all categories available to a user:
// system defaults (userId = null) + user's own categories
export async function findCategoriesForUser(userId: string) {
  return prisma.category.findMany({
    where: {
      OR: [
        { userId: null },   // system-wide defaults
        { userId },         // user's custom categories
      ],
    },
    orderBy: [
      { isDefault: "desc" }, // defaults first
      { name:      "asc" },
    ],
  });
}

export async function findCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({
    where: {
      id,
      OR: [{ userId: null }, { userId }],
    },
  });
}

export async function createCategory(userId: string, data: {
  name:  string;
  color: string;
  icon:  string;
}) {
  return prisma.category.create({
    data: { ...data, userId, isDefault: false },
  });
}

export async function updateCategory(
  id:     string,
  userId: string,
  data:   Prisma.CategoryUpdateInput
) {
  // Only allow updating user-owned categories (not system defaults)
  const cat = await prisma.category.findFirst({
    where: { id, userId }, // userId check ensures it's not a system default
  });
  if (!cat) return null;
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string, userId: string): Promise<boolean> {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) return false;
  await prisma.category.delete({ where: { id } });
  return true;
}

export async function findCategoryByName(name: string, userId: string) {
  return prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      OR:   [{ userId: null }, { userId }],
    },
  });
}

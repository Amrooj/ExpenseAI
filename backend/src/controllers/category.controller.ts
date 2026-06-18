// ============================================================
// src/controllers/category.controller.ts
// ============================================================

import { Response, NextFunction } from "express";
import { AuthRequest }      from "../types";
import * as categoryService from "../services/category.service";
import { sendSuccess, sendCreated, sendNoContent } from "../utils/response";

export async function listCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories(req.user!.userId);
    sendSuccess(res, { categories });
  } catch (e) { next(e); }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.user!.userId, req.body);
    sendCreated(res, { category }, "Category created");
  } catch (e) { next(e); }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.updateCategory(
      req.params["id"]!,
      req.user!.userId,
      req.body
    );
    sendSuccess(res, { category });
  } catch (e) { next(e); }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.params["id"]!, req.user!.userId);
    sendNoContent(res);
  } catch (e) { next(e); }
}

// ============================================================
// src/routes/expense.routes.ts — Expense & Analytics Routes
// ============================================================

import { Router } from "express";
import * as expenseController  from "../controllers/expense.controller";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/authenticate";
import { validate }     from "../middleware/validate";
import { uploadReceipt } from "../middleware/upload";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  expenseIdSchema,
} from "../validators/expense.validator";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "../validators/category.validator";

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// ── Analytics ──────────────────────────────────────────────────
router.get("/analytics/dashboard", expenseController.getDashboard);
router.get("/analytics/trends",    expenseController.getSpendingTrends);

// ── AI Suggest ─────────────────────────────────────────────────
router.post("/suggest-category",   expenseController.suggestCategory);

// ── Bulk Import ────────────────────────────────────────────────
router.post("/bulk-import",        expenseController.bulkImport);

// ── Receipt Upload ─────────────────────────────────────────────
router.post("/:id/receipt",
  validate(expenseIdSchema),
  uploadReceipt,
  expenseController.uploadReceiptHandler
);

// ── Expense CRUD ───────────────────────────────────────────────
router.get("/",
  validate(listExpensesSchema),
  expenseController.listExpenses
);

router.post("/",
  validate(createExpenseSchema),
  expenseController.createExpense
);

// ── Categories ────────────────────────────────────────────────
router.get("/categories",
  categoryController.listCategories
);

router.get("/:id",
  validate(expenseIdSchema),
  expenseController.getExpense
);

router.patch("/:id",
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

router.delete("/:id",
  validate(expenseIdSchema),
  expenseController.deleteExpense
);

router.post("/categories",
  validate(createCategorySchema),
  categoryController.createCategory
);

router.patch("/categories/:id",
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete("/categories/:id",
  validate(categoryIdSchema),
  categoryController.deleteCategory
);

export default router;

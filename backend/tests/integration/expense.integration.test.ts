// ============================================================
// tests/integration/expense.integration.test.ts — Expense API
// ============================================================

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app";

let accessToken = "";
let categoryId  = "";
let expenseId   = "";

const TEST_USER = {
  name:            "Expense Tester",
  email:           `expense_${Date.now()}@example.com`,
  password:        "SecurePass123!",
  confirmPassword: "SecurePass123!",
};

describe("Expense API Integration Tests", () => {
  // Register and login before all tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(TEST_USER);
    accessToken = res.body.data.tokens.accessToken;
  });

  // ── GET /api/expenses/categories ──────────────────────────
  describe("GET /api/expenses/categories", () => {
    it("should list default categories", async () => {
      const res = await request(app)
        .get("/api/expenses/categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.categories).toBeDefined();
      expect(res.body.data.categories.length).toBeGreaterThan(0);
      // Save a category for expense creation
      categoryId = res.body.data.categories[0].id;
    });

    it("should reject unauthenticated request", async () => {
      await request(app)
        .get("/api/expenses/categories")
        .expect(401);
    });
  });

  // ── POST /api/expenses ────────────────────────────────────
  describe("POST /api/expenses", () => {
    it("should create an expense", async () => {
      const res = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          amount:      45.99,
          description: "Integration test dinner",
          date:        new Date().toISOString(),
          categoryId,
        })
        .expect(201);

      expect(res.body.data.expense).toBeDefined();
      expect(res.body.data.expense.amount).toBe(45.99);
      expect(res.body.data.expense.description).toBe("Integration test dinner");
      expenseId = res.body.data.expense.id;
    });

    it("should reject expense with invalid categoryId", async () => {
      await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          amount:      10,
          description: "Bad category",
          date:        new Date().toISOString(),
          categoryId:  "non-existent-id",
        })
        .expect(400);
    });

    it("should reject expense without required fields", async () => {
      await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 10 }) // missing description, date, categoryId
        .expect(400);
    });
  });

  // ── GET /api/expenses ─────────────────────────────────────
  describe("GET /api/expenses", () => {
    it("should list user expenses with pagination", async () => {
      const res = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it("should filter by search term", async () => {
      const res = await request(app)
        .get("/api/expenses?search=dinner")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── GET /api/expenses/:id ─────────────────────────────────
  describe("GET /api/expenses/:id", () => {
    it("should return a single expense", async () => {
      const res = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.expense.id).toBe(expenseId);
    });

    it("should return 404 for non-existent expense", async () => {
      await request(app)
        .get("/api/expenses/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ── PATCH /api/expenses/:id ───────────────────────────────
  describe("PATCH /api/expenses/:id", () => {
    it("should update an expense", async () => {
      const res = await request(app)
        .patch(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 99.99, description: "Updated dinner" })
        .expect(200);

      expect(res.body.data.expense.amount).toBe(99.99);
      expect(res.body.data.expense.description).toBe("Updated dinner");
    });
  });

  // ── POST /api/expenses/suggest-category ───────────────────
  describe("POST /api/expenses/suggest-category", () => {
    it("should suggest a category for a description", async () => {
      const res = await request(app)
        .post("/api/expenses/suggest-category")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ description: "Uber ride to airport", amount: 35 })
        .expect(200);

      // AI should return a suggestion (or null if AI is off)
      expect(res.body.data).toBeDefined();
    });
  });

  // ── DELETE /api/expenses/:id ──────────────────────────────
  describe("DELETE /api/expenses/:id", () => {
    it("should delete an expense", async () => {
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      // Verify it's gone
      await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ── Analytics ─────────────────────────────────────────────
  describe("GET /api/expenses/analytics/dashboard", () => {
    it("should return dashboard summary", async () => {
      const res = await request(app)
        .get("/api/expenses/analytics/dashboard")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.thisMonth).toBeDefined();
    });
  });
});

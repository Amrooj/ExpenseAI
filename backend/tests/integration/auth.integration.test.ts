// ============================================================
// tests/integration/auth.integration.test.ts — Auth API Tests
// ============================================================
//
// 🎓 TEACHING: Integration Tests vs Unit Tests
//
// Unit tests (what we wrote before):
//   - Test ONE function in isolation
//   - Mock all dependencies (database, external APIs)
//   - Fast (milliseconds), run without a database
//
// Integration tests (this file):
//   - Test the FULL request → response cycle
//   - Use supertest to send real HTTP requests to Express
//   - Test middleware, validation, services, database — all together
//   - Slower, require a database connection
//
// Both are essential. Unit tests catch logic bugs.
// Integration tests catch wiring bugs (middleware order, route config).
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";

// Test user credentials
const TEST_USER = {
  name:            "Test User",
  email:           `test_${Date.now()}@example.com`,
  password:        "SecurePass123!",
  confirmPassword: "SecurePass123!",
};

let accessToken  = "";
let refreshToken = "";

describe("Auth API Integration Tests", () => {

  // ── POST /api/auth/register ────────────────────────────────
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(TEST_USER)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      // Save tokens for subsequent tests
      accessToken  = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it("should reject duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send(TEST_USER)
        .expect(409); // Conflict
    });

    it("should reject weak password", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ ...TEST_USER, email: "weak@test.com", password: "123", confirmPassword: "123" })
        .expect(400);
    });

    it("should reject mismatched passwords", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ ...TEST_USER, email: "mismatch@test.com", confirmPassword: "DifferentPass!" })
        .expect(400);
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────
  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_USER.email, password: TEST_USER.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      accessToken  = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it("should reject wrong password", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_USER.email, password: "WrongPassword!" })
        .expect(401);
    });

    it("should reject non-existent email", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ email: "ghost@test.com", password: "anything" })
        .expect(401);
    });
  });

  // ── GET /api/auth/me ───────────────────────────────────────
  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.user.name).toBe(TEST_USER.name);
    });

    it("should reject request without token", async () => {
      await request(app)
        .get("/api/auth/me")
        .expect(401);
    });

    it("should reject request with invalid token", async () => {
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);
    });
  });

  // ── POST /api/auth/refresh ─────────────────────────────────
  describe("POST /api/auth/refresh", () => {
    it("should return new tokens with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Update tokens for next tests
      accessToken  = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────
  describe("POST /api/auth/logout", () => {
    it("should logout and invalidate refresh token", async () => {
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Old refresh token should no longer work
      await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(401);
    });
  });
});

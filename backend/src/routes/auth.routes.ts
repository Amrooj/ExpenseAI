// ============================================================
// src/routes/auth.routes.ts — Auth Route Definitions
// ============================================================
//
// 🎓 TEACHING: Express Router
//
// An Express Router is a mini-application that handles routes
// for a specific path prefix. In app.ts we mount it:
//   app.use("/api/auth", authRouter)
//
// So router.post("/login") becomes POST /api/auth/login
//
// WHY USE A ROUTER instead of defining routes in app.ts?
//   - Separation of concerns — auth routes in one file
//   - Cleaner app.ts (just mounts routers, no route logic)
//   - Easy to move routes to a different path prefix
//
// ROUTE DEFINITION PATTERN:
//   router.METHOD(path, ...middleware, controller)
//
//   Middleware runs LEFT TO RIGHT, in order:
//   1. validate(schema) → validates request body
//   2. authenticate    → verifies JWT (only on protected routes)
//   3. controller      → handles the actual request
// ============================================================

import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate }     from "../middleware/authenticate";
import { validate }         from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

const router = Router();

// ── Public Routes (no JWT required) ──────────────────────────

// POST /api/auth/register
router.post(
  "/register",
  validate(registerSchema),    // 1. Validate body
  authController.register      // 2. Handle request
);

// POST /api/auth/login
router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken
);

// POST /api/auth/logout
// Note: logout doesn't require authenticate middleware
// The refresh token itself identifies the session to revoke
router.post("/logout", validate(logoutSchema), authController.logout);

// ── Protected Routes (JWT required) ──────────────────────────

// GET /api/auth/me
router.get(
  "/me",
  authenticate,           // 1. Verify JWT → attach req.user
  authController.getMe    // 2. Return user profile
);

// PATCH /api/auth/me — update profile (name, currency, timezone)
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  authController.updateMe
);

// POST /api/auth/logout-all
router.post(
  "/logout-all",
  authenticate,
  authController.logoutAll
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;

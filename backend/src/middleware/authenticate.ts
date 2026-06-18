// ============================================================
// src/middleware/authenticate.ts — JWT Auth Middleware
// ============================================================
//
// 🎓 TEACHING: Authentication vs Authorization
//
// AUTHENTICATION = "Who are you?" → verified by JWT
// AUTHORIZATION  = "What can you do?" → checked by role/ownership
//
// This middleware handles AUTHENTICATION only.
// It answers: "Is this a valid, logged-in user?"
//
// For AUTHORIZATION, we'll add ownership checks in each
// service: "Does this user OWN this expense?"
//
// HOW IT WORKS:
//   1. Extract "Bearer <token>" from Authorization header
//   2. Verify the JWT signature and expiry
//   3. Attach decoded user data to req.user
//   4. Call next() to proceed to the controller
//   5. If anything fails → 401 Unauthorized
// ============================================================

import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { extractBearerToken, verifyAccessToken } from "../utils/jwt";
import { createError } from "./errorHandler";

// ── Authenticate Middleware ───────────────────────────────────
// Protects routes that require a logged-in user
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Step 1: Extract token from Authorization header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw createError.unauthorized(
        "No authentication token provided. Please login."
      );
    }

    // Step 2: Verify token signature and expiry
    const payload = verifyAccessToken(token);

    // Step 3: Attach user data to request object
    // Every subsequent middleware and controller now has access
    // to req.user.userId and req.user.email
    req.user = payload;

    // Step 4: Continue to next middleware/controller
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCESS_TOKEN_EXPIRED") {
        next(createError.unauthorized("Session expired. Please refresh your token."));
        return;
      }
      if (error.message === "INVALID_ACCESS_TOKEN") {
        next(createError.unauthorized("Invalid authentication token."));
        return;
      }
    }
    next(error);
  }
}

// ── Optional Auth Middleware ──────────────────────────────────
// Like authenticate, but doesn't reject if no token is present.
// Useful for routes that have different behavior for logged-in users.
// (e.g., a public API that shows extra data for authenticated users)
export function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      req.user = verifyAccessToken(token);
    }
    next();
  } catch {
    // Silently ignore auth errors for optional auth
    next();
  }
}

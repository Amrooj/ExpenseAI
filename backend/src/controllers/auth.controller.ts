// ============================================================
// src/controllers/auth.controller.ts — Auth HTTP Layer
// ============================================================
//
// 🎓 TEACHING: The Controller Layer
//
// Controllers are the THINNEST layer. Their ONLY jobs are:
//   1. Extract data from the HTTP request (req.body, req.headers)
//   2. Call the service with that data
//   3. Send the service result back as an HTTP response
//
// Controllers know about HTTP. Services DO NOT.
//
// A controller should NEVER:
//   ❌ Write database queries
//   ❌ Hash passwords
//   ❌ Contain IF/ELSE business logic
//   ❌ Be longer than ~20-30 lines
//
// If your controller is getting long, move logic to the service.
//
// PATTERN: try/catch with next(error)
//   Services throw AppError instances.
//   Controllers catch them and pass to errorHandler middleware.
//   This keeps error formatting in ONE place (errorHandler.ts).
// ============================================================

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { AuthRequest } from "../types";
import { sendSuccess, sendCreated } from "../utils/response";
import * as authRepo from "../repositories/auth.repository";
import { createError } from "../middleware/errorHandler";

// ── POST /api/auth/register ───────────────────────────────────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(
      req.body,
      req.headers["user-agent"],
      req.ip
    );

    // 201 Created — resource was created
    sendCreated(res, result, "Account created successfully");
  } catch (error) {
    next(error);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(
      req.body,
      req.headers["user-agent"],
      req.ip
    );

    // 200 OK
    sendSuccess(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: rawToken } = req.body as { refreshToken: string };

    const result = await authService.refreshTokens(
      rawToken,
      req.headers["user-agent"],
      req.ip
    );

    sendSuccess(res, result, "Tokens refreshed");
  } catch (error) {
    next(error);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: rawToken } = req.body as { refreshToken: string };

    if (!rawToken) {
      throw createError.badRequest("Refresh token is required");
    }

    await authService.logout(rawToken);
    sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

// ── POST /api/auth/logout-all ─────────────────────────────────
// Logs user out from all devices by revoking all their refresh tokens
export async function logoutAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.logoutAll(req.user!.userId);
    sendSuccess(res, null, "Logged out from all devices");
  } catch (error) {
    next(error);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────
// Returns the currently authenticated user's profile
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authRepo.findUserById(req.user!.userId);

    if (!user) {
      throw createError.notFound("User");
    }

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

// ── PATCH /api/auth/me ────────────────────────────────────────
// Update current user's profile (name, currency, timezone)
export async function updateMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, defaultCurrency, timezone } = req.body as {
      name?: string;
      defaultCurrency?: string;
      timezone?: string;
    };

    const updated = await authRepo.updateUser(req.user!.userId, {
      ...(name            && { name }),
      ...(defaultCurrency && { defaultCurrency }),
      ...(timezone        && { timezone }),
    });

    sendSuccess(res, { user: updated }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
}

// ── POST /api/auth/change-password ────────────────────────────
export async function changePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    if (!currentPassword || !newPassword) {
      throw createError.badRequest("currentPassword and newPassword are required");
    }
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
}

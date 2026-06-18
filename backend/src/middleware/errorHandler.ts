// ============================================================
// src/middleware/errorHandler.ts — Global Error Handler
// ============================================================
//
// 🎓 TEACHING: Error Handling in Express
//
// In Express, a middleware function with FOUR arguments
// (err, req, res, next) is automatically treated as an
// "error-handling middleware". Express routes errors to it
// when you call `next(error)` from any route or middleware.
//
// WITHOUT a centralized error handler:
//   - Every controller would have its own try/catch with res.json(...)
//   - Error responses would be inconsistent (different formats)
//   - You'd accidentally leak stack traces in production
//   - Adding error logging means touching every single file
//
// WITH a centralized error handler:
//   - Consistent error response format across all endpoints
//   - Stack traces hidden in production
//   - One place to add logging, alerting, monitoring
//   - Controllers only throw — they never format errors
// ============================================================

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { log } from "../utils/logger";
import { env } from "../config/env";

// ── Custom Application Error Class ───────────────────────────
//
// 🎓 TEACHING: Why extend the built-in Error class?
//
// The native `Error` only has `message` and `stack`.
// Our `AppError` adds:
//   - `statusCode`: HTTP status (400, 401, 403, 404, 500...)
//   - `isOperational`: Was this an expected error (e.g., "user not found")
//     or an unexpected bug? Operational errors are safe to show users.
//     Non-operational errors indicate bugs — never show details to users.
//
// This pattern is used in production Node.js apps worldwide.
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    // Fix prototype chain — needed when extending built-in classes in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
    // Capture stack trace (excludes the constructor call)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Pre-built Error Factories ─────────────────────────────────
// These make throwing common errors clean and consistent
export const createError = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404),

  unauthorized: (message = "Authentication required") =>
    new AppError(message, 401),

  forbidden: (message = "You don't have permission to perform this action") =>
    new AppError(message, 403),

  badRequest: (message: string) =>
    new AppError(message, 400),

  conflict: (message: string) =>
    new AppError(message, 409),

  internal: (message = "Internal server error") =>
    new AppError(message, 500, false), // false = NOT operational (it's a bug)
};

// ── Standardized API Error Response Shape ────────────────────
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    // Only included in development mode
    stack?: string;
  };
}

// ── Global Error Handler Middleware ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Handle Zod Validation Errors ─────────────────────────
  // Zod is our schema validation library (used in M2+)
  // When a request body fails validation, Zod throws ZodError
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.errors.forEach((e) => {
      // Remove "body." or similar prefix if present, otherwise join path
      const path = e.path[0] === "body" ? e.path.slice(1).join(".") : e.path.join(".");
      const key = path || "general";
      if (!fields[key]) {
        fields[key] = e.message;
      }
    });

    res.status(400).json({
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        fields,
      },
    });
    return;
  }

  // ── Handle Our Custom AppError ────────────────────────────
  if (err instanceof AppError) {
    // Log operational errors at warn level, bugs at error level
    if (err.isOperational) {
      log.warn(`[${err.statusCode}] ${err.message}`, {
        path: req.path,
        method: req.method,
      });
    } else {
      log.error(`[${err.statusCode}] ${err.message}`, err, {
        path: req.path,
        method: req.method,
      });
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        // Include stack trace ONLY in development
        ...(env.isDevelopment && { stack: err.stack }),
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Handle Prisma Errors ──────────────────────────────────
  // Prisma has specific error codes for common DB errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === "P2002") {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] ?? "field";
      res.status(409).json({
        success: false,
        error: {
          message: `A record with this ${field} already exists`,
          code: "DUPLICATE_ENTRY",
        },
      } satisfies ErrorResponse);
      return;
    }

    if (prismaError.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        error: { message: "Record not found", code: "NOT_FOUND" },
      } satisfies ErrorResponse);
      return;
    }
  }

  // ── Handle Unknown / Unexpected Errors ────────────────────
  // This is a bug — log it fully for debugging
  log.error("Unexpected error", err, {
    path: req.path,
    method: req.method,
    body: req.body,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      message: env.isProduction ? "Something went wrong" : err.message,
      ...(env.isDevelopment && { stack: err.stack }),
    },
  };

  res.status(500).json(response);
}

// ── 404 Handler ───────────────────────────────────────────────
// Must be registered AFTER all routes in app.ts
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
}

// ============================================================
// src/middleware/validate.ts — Zod Validation Middleware
// ============================================================
//
// 🎓 TEACHING: Middleware as a Reusable Cross-Cutting Concern
//
// "Cross-cutting concern" = something needed by MANY parts of
// the app, but not core business logic. Examples:
//   - Input validation (needed by every POST/PATCH endpoint)
//   - Authentication (needed by every protected endpoint)
//   - Logging (needed everywhere)
//   - Rate limiting
//
// Instead of writing validation logic in every controller,
// we create ONE middleware that accepts a Zod schema and
// validates the request. This middleware can be applied to
// any route with a single line: router.post("/", validate(schema), handler)
//
// This is the "Decorator Pattern" in action.
// ============================================================

import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

// ── Validate Middleware Factory ───────────────────────────────
// Returns a middleware function configured for a specific schema
// This is a "Higher-Order Function" — a function that returns a function
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body:   req.body,
        params: req.params,
        query:  req.query,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params;
      if (parsed.query !== undefined) req.query = parsed.query;

      // Validation passed → continue to next middleware/controller
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into structured validation error fields
        const fields: Record<string, string> = {};
        error.errors.forEach((e) => {
          const path = e.path.slice(1).join("."); // Remove "body." prefix
          const key = path || "general";
          // Capture the first error message for each field
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
      // Unknown error — pass to global error handler
      next(error);
    }
  };
};

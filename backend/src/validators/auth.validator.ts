// ============================================================
// src/validators/auth.validator.ts — Zod Validation Schemas
// ============================================================
//
// 🎓 TEACHING: What is Zod?
//
// Zod is a TypeScript-first schema validation library.
// You define the SHAPE and RULES of data you expect.
// Zod validates incoming data at runtime and gives you
// perfect TypeScript types for free.
//
// WHY ZOD OVER MANUAL VALIDATION?
//   Manual:  if (!email) return res.status(400)...
//            if (!email.includes("@")) return res.status(400)...
//            if (password.length < 8) return res.status(400)...
//   Zod:     One schema → validation + TypeScript types + error messages
//
// CRITICAL SECURITY RULE:
//   NEVER trust data from the client (req.body).
//   ALWAYS validate it at the API boundary before it reaches
//   your service or database layer. Zod is your first line of defense.
// ============================================================

import { z } from "zod";

// ── Register Schema ───────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot exceed 72 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),

    confirmPassword: z
      .string({ required_error: "Please confirm your password" }),

    defaultCurrency: z
      .string()
      .length(3, "Currency must be a 3-letter code (e.g. USD)")
      .toUpperCase()
      .optional()
      .default("USD"),

    timezone: z.string().optional().default("UTC"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Which field to attach the error to
  }),
});

// ── Login Schema ─────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address"),

    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

// ── Refresh Token Schema ──────────────────────────────────────
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: "Refresh token is required" })
      .min(1, "Refresh token is required"),
  }),
});

// ── TypeScript Types (inferred from Zod schemas) ──────────────
// 🎓 TEACHING: z.infer<> extracts the TypeScript type from a schema.
// You get type safety for FREE — no need to define types separately.
export type RegisterDto = z.infer<typeof registerSchema>["body"];
export type LoginDto    = z.infer<typeof loginSchema>["body"];

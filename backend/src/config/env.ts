// ============================================================
// src/config/env.ts — Centralized Environment Configuration
// ============================================================
//
// 🎓 TEACHING: Why have a config file instead of using
//              process.env directly everywhere?
//
// BAD PATTERN (what beginners do):
//   const secret = process.env.JWT_SECRET  // in 20 different files
//   // Problem 1: process.env values are always `string | undefined`
//   //            TypeScript can't help you if the variable is missing
//   // Problem 2: If you rename the variable, you must hunt through 20 files
//   // Problem 3: No single place to document what each variable does
//
// GOOD PATTERN (what we do):
//   All env access in ONE file → validate at startup → export typed constants
//   Every other file just imports from this file.
//   If an env variable is missing → app crashes immediately with a clear error
//   (better than crashing mysteriously 10 minutes later when the code runs)
//
// This pattern is called "Fail Fast" — detect problems at startup,
// not when they cause damage deep in the business logic.
// ============================================================

import dotenv from "dotenv";

// Load .env file into process.env
// Must be called before accessing any env variables
dotenv.config();

// ── Validation Helper ────────────────────────────────────────
// Returns the value or throws a descriptive error if missing
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
      `   Please copy .env.example to .env and fill in all values.`
    );
  }
  return value;
}

// Returns the value or a default if missing (for optional vars)
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: "${value}"`);
  }
  return parsed;
}

// ── Validated & Typed Configuration Object ──────────────────
//
// 🎓 TEACHING: We use `as const` to make TypeScript infer
// literal types instead of widened types.
// e.g. Without `as const`: nodeEnv is type `string`
//      With `as const`:    nodeEnv is type `"development" | "production" | "test"`
export const env = {
  // ── Server ────────────────────────────────────────────────
  port: optionalEnvNumber("PORT", 3000),
  nodeEnv: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  isDevelopment: optionalEnv("NODE_ENV", "development") === "development",
  isProduction: optionalEnv("NODE_ENV", "development") === "production",
  isTest: optionalEnv("NODE_ENV", "development") === "test",

  // ── Database ──────────────────────────────────────────────
  databaseUrl: requireEnv("DATABASE_URL"),

  // ── JWT ───────────────────────────────────────────────────
  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: optionalEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  // ── AI Provider ───────────────────────────────────────────
  ai: {
    // Which AI provider to use: "gemini" | "rule-based"
    provider: optionalEnv("AI_PROVIDER", "rule-based") as "gemini" | "rule-based",
    geminiApiKey: optionalEnv("GEMINI_API_KEY", ""),
  },

  // ── Storage Provider ──────────────────────────────────────
  storage: {
    provider: optionalEnv("STORAGE_PROVIDER", "local") as "local" | "s3" | "cloudinary",
    uploadDir: optionalEnv("UPLOAD_DIR", "./uploads"),
    maxFileSizeMb: optionalEnvNumber("MAX_FILE_SIZE_MB", 5),

    // Cloudinary (only needed if provider = "cloudinary")
    cloudinary: {
      cloudName: optionalEnv("CLOUDINARY_CLOUD_NAME", ""),
      apiKey: optionalEnv("CLOUDINARY_API_KEY", ""),
      apiSecret: optionalEnv("CLOUDINARY_API_SECRET", ""),
    },

    // AWS S3 (only needed if provider = "s3")
    s3: {
      accessKeyId: optionalEnv("AWS_ACCESS_KEY_ID", ""),
      secretAccessKey: optionalEnv("AWS_SECRET_ACCESS_KEY", ""),
      region: optionalEnv("AWS_REGION", "us-east-1"),
      bucket: optionalEnv("AWS_S3_BUCKET", ""),
    },
  },

  // ── CORS ──────────────────────────────────────────────────
  frontendUrl: optionalEnv("FRONTEND_URL", "http://localhost:5173"),

  // ── Rate Limiting ─────────────────────────────────────────
  rateLimit: {
    windowMs: optionalEnvNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 min
    maxRequests: optionalEnvNumber("RATE_LIMIT_MAX_REQUESTS", 100),
  },
} as const;

// ── Type Export ───────────────────────────────────────────────
// Other files can use this type for typed configuration
export type Env = typeof env;

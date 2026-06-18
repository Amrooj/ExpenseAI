// ============================================================
// src/types/index.ts — Shared TypeScript Types & Interfaces
// ============================================================
//
// 🎓 TEACHING: Why have a centralized types file?
//
// In a real API, many files need the same types:
//   - "What does an authenticated request look like?"
//   - "What shape does our API response always have?"
//
// Defining these types in ONE place means:
//   - Change it once → all files automatically updated
//   - No duplication → no inconsistency
//   - Easy to find → new developers know where to look
//
// This follows the DRY principle: Don't Repeat Yourself.
// ============================================================

import { Request } from "express";

// ============================================================
// AUTHENTICATED REQUEST
//
// When a user logs in, our auth middleware verifies their JWT
// and attaches user data to the request object.
//
// But TypeScript's built-in `Request` type doesn't have a `user`
// property. We extend it here so TypeScript knows:
// "If a route uses AuthRequest, req.user is guaranteed to exist."
//
// 🎓 TEACHING: This is called "Module Augmentation" or
// "Declaration Merging" — extending an existing TypeScript type.
// ============================================================
export interface JwtPayload {
  userId: string;
  email: string;
  // `iat` = issued at (Unix timestamp) — added automatically by JWT library
  // `exp` = expiration (Unix timestamp)
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ============================================================
// STANDARD API RESPONSE ENVELOPE
//
// Every API endpoint returns data in this consistent shape.
// WHY? API consumers (your React frontend) can always expect:
//   - success: true/false
//   - data (if success)
//   - error (if failure)
//
// This pattern is called the "API Response Envelope" pattern.
// It's used by Stripe, GitHub, Twilio, and most production APIs.
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================
// PAGINATION QUERY PARAMETERS
// Used for list endpoints: GET /expenses?page=2&limit=20
// ============================================================
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// EXPENSE FILTER QUERY PARAMETERS
// GET /expenses?startDate=2024-01-01&category=food&search=lunch
// ============================================================
export interface ExpenseFilterQuery extends PaginationQuery {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  isRecurring?: boolean;
  currency?: string;
}

// ============================================================
// RECURRING INTERVAL (mirrors Prisma enum)
// Having it here means frontend can import it from a shared
// types package in the future (monorepo setup).
// ============================================================
export type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type AIProvider = "GEMINI" | "RULE_BASED";
export type StorageProvider = "local" | "s3" | "cloudinary";

// ============================================================
// src/utils/response.ts — API Response Helper Functions
// ============================================================
//
// 🎓 TEACHING: Why have response helper functions?
//
// Without helpers, every controller writes:
//   res.status(200).json({ success: true, data: { user }, message: "Created" })
//   res.status(201).json({ success: true, data: { user }, message: "Created" })
//   res.status(400).json({ success: false, error: { message: "..." } })
//
// Problems:
//   1. Typo risk: `succcess: true` (typo, compiles fine, breaks client)
//   2. Inconsistency: some use `data`, some use `result`, some use `payload`
//   3. Verbose: repeated code in every controller
//
// Solution: Helper functions that enforce the standard shape.
// Controllers become: sendSuccess(res, { user }, "Created", 201)
//
// RESULT: Perfectly consistent API responses every time.
// ============================================================

import { Response } from "express";
import { PaginationMeta } from "../types";

// ── Success Response ──────────────────────────────────────────
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: PaginationMeta
): void {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta }),
  });
}

// ── Created Response (201) ────────────────────────────────────
export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

// ── No Content Response (204) ─────────────────────────────────
// Used for DELETE operations that return no body
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

// ── Paginated Response ────────────────────────────────────────
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const totalPages = Math.ceil(total / limit);
  sendSuccess(res, data, undefined, 200, {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
}

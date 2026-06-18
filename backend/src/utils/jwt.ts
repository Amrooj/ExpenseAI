// ============================================================
// src/utils/jwt.ts — JWT Token Utilities
// ============================================================
//
// 🎓 TEACHING: Token Rotation Strategy
//
// We use TWO tokens:
//
// 1. ACCESS TOKEN (short-lived: 15 minutes)
//    - Sent in Authorization header: "Bearer <token>"
//    - Stateless — server doesn't store it
//    - Can't be revoked (expires on its own)
//    - Contains: userId, email
//
// 2. REFRESH TOKEN (long-lived: 7 days)
//    - Sent in request body on /api/auth/refresh
//    - Stored (hashed) in database — CAN be revoked
//    - Used ONLY to get new access tokens
//    - Contains: userId only (minimal data)
//
// FLOW:
//   Login → get accessToken + refreshToken
//   API call → send accessToken in header
//   Token expires → send refreshToken → get new accessToken
//   Logout → delete refreshToken from DB → cannot refresh anymore
//
// SECURITY: We hash the refresh token before storing it in DB.
// If the DB is stolen, raw token strings are useless.
// (Same principle as password hashing)
// ============================================================

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { JwtPayload } from "../types";

// ── Generate Access Token ─────────────────────────────────────
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email:  payload.email,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
      // issuer: identifies who issued the token (your app)
      issuer: "expense-tracker-api",
      // audience: identifies who the token is for
      audience: "expense-tracker-client",
    }
  );
}

// ── Generate Refresh Token ────────────────────────────────────
// Refresh tokens contain MINIMAL data (just userId)
// The less data in a token, the less useful it is if stolen
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
      issuer: "expense-tracker-api",
      audience: "expense-tracker-client",
    }
  );
}

// ── Verify Access Token ───────────────────────────────────────
// Returns the decoded payload or throws an error
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret, {
      issuer:   "expense-tracker-api",
      audience: "expense-tracker-client",
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("ACCESS_TOKEN_EXPIRED");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("INVALID_ACCESS_TOKEN");
    }
    throw error;
  }
}

// ── Verify Refresh Token ──────────────────────────────────────
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret, {
      issuer:   "expense-tracker-api",
      audience: "expense-tracker-client",
    }) as { userId: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }
    throw new Error("INVALID_REFRESH_TOKEN");
  }
}

// ── Hash Token for Storage ────────────────────────────────────
//
// 🎓 TEACHING: Why hash the refresh token before storing?
//
// If someone gains read access to your database (SQL injection,
// backup leak, insider threat), raw refresh tokens let them
// impersonate users indefinitely.
//
// By storing only the HASH of the refresh token:
//   - Attacker gets the hash → useless (can't reverse to original)
//   - Verification: hash incoming token → compare to stored hash
//
// We use SHA-256 here (not bcrypt) because:
//   - We're comparing fixed-length strings (no brute force risk)
//   - SHA-256 is fast for comparison (bcrypt's slowness isn't needed)
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ── Extract Token from Header ─────────────────────────────────
// Parses "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// Returns the token string or null
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix (7 characters)
}

// ── Get Refresh Token Expiry Date ─────────────────────────────
// Returns the Date when the refresh token will expire
export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  // Parse "7d" → add 7 days
  const expiresIn = env.jwt.refreshExpiresIn;
  if (expiresIn.endsWith("d")) {
    expiry.setDate(expiry.getDate() + parseInt(expiresIn));
  } else if (expiresIn.endsWith("h")) {
    expiry.setHours(expiry.getHours() + parseInt(expiresIn));
  } else {
    // Default: 7 days
    expiry.setDate(expiry.getDate() + 7);
  }
  return expiry;
}

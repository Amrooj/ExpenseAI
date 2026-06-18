// ============================================================
// src/services/auth.service.ts — Auth Business Logic
// ============================================================
//
// 🎓 TEACHING: The Service Layer
//
// The Service is where your BUSINESS LOGIC lives.
// It orchestrates: validation → repository → token generation → etc.
//
// RESPONSIBILITIES:
//   ✅ Enforce business rules ("email must be unique")
//   ✅ Coordinate between multiple repositories
//   ✅ Hash passwords, generate tokens
//   ✅ Throw domain-specific errors (AppError)
//   ❌ NOT: Know about HTTP (req, res, status codes)
//   ❌ NOT: Know about Prisma directly (uses repositories)
//   ❌ NOT: Know about Express middleware
//
// WHY THIS MATTERS:
//   You could call auth.service.register() from:
//   - An Express HTTP handler
//   - A CLI script
//   - A GraphQL resolver
//   - A test file
//   ...and it works identically. It has no HTTP dependencies.
//
// TESTING BENEFIT:
//   To test the service, you mock the repository.
//   No database, no HTTP server needed.
//   Tests run in milliseconds.
// ============================================================

import bcrypt from "bcryptjs";
import * as authRepo from "../repositories/auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { createError } from "../middleware/errorHandler";
import { log } from "../utils/logger";
import { RegisterDto, LoginDto } from "../validators/auth.validator";

// ── BCRYPT COST FACTOR ────────────────────────────────────────
// 🎓 TEACHING: What is a bcrypt cost factor?
//
// bcrypt deliberately runs SLOW to prevent brute-force attacks.
// The cost factor (also called "rounds" or "work factor") is an
// exponent: cost=12 means 2^12 = 4,096 iterations.
//
// Cost 10: ~100ms  (minimum acceptable)
// Cost 12: ~300ms  (good balance — industry standard)
// Cost 14: ~1200ms (very strong, noticeable to users)
//
// Rule: Choose the highest cost factor that gives <500ms on your server.
// Increase it every few years as hardware gets faster.
const BCRYPT_ROUNDS = 12;

// ── Register ─────────────────────────────────────────────────
interface RegisterResult {
  user: {
    id: string;
    email: string;
    name: string;
    defaultCurrency: string;
    timezone: string;
    createdAt: Date;
  };
  tokens: {
    accessToken:  string;
    refreshToken: string;
  };
}

export async function register(
  dto: RegisterDto,
  userAgent?: string,
  ipAddress?: string
): Promise<RegisterResult> {
  // ── Step 1: Check if email is already taken ───────────────
  // This is a BUSINESS RULE, not just a DB constraint.
  // We check explicitly to give a meaningful error message.
  // (The DB unique constraint is a safety net, not the primary check)
  const exists = await authRepo.emailExists(dto.email);
  if (exists) {
    throw createError.conflict(
      "An account with this email already exists. Please login or use a different email."
    );
  }

  // ── Step 2: Hash the password ─────────────────────────────
  // CRITICAL: The plain password NEVER touches the database.
  // We hash it here, store the hash, and discard the plain text.
  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

  // ── Step 3: Create user in database ──────────────────────
  const user = await authRepo.createUser({
    email:           dto.email,
    name:            dto.name,
    passwordHash,
    defaultCurrency: dto.defaultCurrency,
    timezone:        dto.timezone,
  });

  // ── Step 4: Generate tokens ───────────────────────────────
  const { accessToken, refreshToken } = await createTokenPair(
    user.id,
    dto.email,
    userAgent,
    ipAddress
  );

  log.info("New user registered", { userId: user.id, email: user.email });

  return { user, tokens: { accessToken, refreshToken } };
}

// ── Login ─────────────────────────────────────────────────────
interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    defaultCurrency: string;
    timezone: string;
  };
  tokens: {
    accessToken:  string;
    refreshToken: string;
  };
}

export async function login(
  dto: LoginDto,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResult> {
  // ── Step 1: Find user by email ────────────────────────────
  const user = await authRepo.findUserByEmail(dto.email);

  // ── Step 2: Verify password ───────────────────────────────
  // SECURITY: We use the SAME error message for both "user not found"
  // and "wrong password". WHY?
  //
  // If we said "User not found" → attacker knows the email isn't registered
  //   → They can enumerate valid emails via our API
  // Vague error "Invalid credentials" → attacker learns nothing
  //
  // This is called "User Enumeration Prevention" — a security best practice.
  const isValidPassword = user
    ? await bcrypt.compare(dto.password, user.passwordHash)
    : false;

  if (!user || !isValidPassword || !user.isActive) {
    throw createError.unauthorized(
      "Invalid email or password. Please check your credentials."
    );
  }

  // ── Step 3: Generate tokens ───────────────────────────────
  const { accessToken, refreshToken } = await createTokenPair(
    user.id,
    user.email,
    userAgent,
    ipAddress
  );

  log.info("User logged in", { userId: user.id });

  return {
    user: {
      id:              user.id,
      email:           user.email,
      name:            user.name,
      defaultCurrency: user.defaultCurrency,
      timezone:        user.timezone,
    },
    tokens: { accessToken, refreshToken },
  };
}

// ── Refresh Token ─────────────────────────────────────────────
interface RefreshResult {
  accessToken:  string;
  refreshToken: string;
}

export async function refreshTokens(
  rawRefreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<RefreshResult> {
  // ── Step 1: Verify JWT signature ──────────────────────────
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw createError.unauthorized("Invalid or expired refresh token. Please login again.");
  }

  // ── Step 2: Check token exists in database ────────────────
  // Even if JWT is valid, the token might have been revoked (logout)
  const hashedToken = hashToken(rawRefreshToken);
  const storedToken = await authRepo.findRefreshToken(hashedToken);

  if (!storedToken) {
    // Token was revoked or never existed
    // SECURITY: This could be a token reuse attack.
    // Log it for security monitoring.
    log.warn("Refresh token not found in database — possible reuse attack", {
      userId: decoded.userId,
    });
    throw createError.unauthorized("Session has been revoked. Please login again.");
  }

  // Check if token is expired in DB (redundant but safe)
  if (storedToken.expiresAt < new Date()) {
    await authRepo.deleteRefreshToken(hashedToken);
    throw createError.unauthorized("Session expired. Please login again.");
  }

  // Check if the associated user is still active
  if (!storedToken.user.isActive) {
    throw createError.unauthorized("Account is deactivated.");
  }

  // ── Step 3: Token Rotation ────────────────────────────────
  // 🎓 TEACHING: What is refresh token rotation?
  //
  // Every time you use a refresh token, you get a NEW one back.
  // The old one is deleted from the database.
  //
  // WHY? If an attacker steals an old refresh token, it's already
  // been replaced — it no longer works. This limits the attack window.
  //
  // This technique is called "Refresh Token Rotation" and is
  // recommended by OAuth 2.0 best practices (RFC 6749).
  await authRepo.deleteRefreshToken(hashedToken);

  const { accessToken, refreshToken: newRefreshToken } = await createTokenPair(
    storedToken.userId,
    storedToken.user.email,
    userAgent,
    ipAddress
  );

  return { accessToken, refreshToken: newRefreshToken };
}

// ── Logout ────────────────────────────────────────────────────
export async function logout(rawRefreshToken: string): Promise<void> {
  const hashedToken = hashToken(rawRefreshToken);
  await authRepo.deleteRefreshToken(hashedToken);
  log.info("User logged out (single device)");
}

// ── Logout All Devices ────────────────────────────────────────
export async function logoutAll(userId: string): Promise<void> {
  await authRepo.deleteAllUserRefreshTokens(userId);
  log.info("User logged out from all devices", { userId });
}

// ── Change Password ──────────────────────────────────────────
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await authRepo.findUserByEmail(
    (await authRepo.findUserById(userId))!.email
  );
  if (!user) throw createError.notFound("User");

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw createError.unauthorized("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await authRepo.updateUser(userId, { passwordHash });
  log.info("Password changed", { userId });
}

// ── Private Helper: Create Token Pair ────────────────────────
// DRY principle — token creation is identical in register/login/refresh
async function createTokenPair(
  userId:    string,
  email:     string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken  = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken(userId);

  // Store HASHED refresh token in database
  await authRepo.createRefreshToken({
    token:    hashToken(refreshToken),
    userId,
    expiresAt: getRefreshTokenExpiry(),
    userAgent,
    ipAddress,
  });

  return { accessToken, refreshToken };
}

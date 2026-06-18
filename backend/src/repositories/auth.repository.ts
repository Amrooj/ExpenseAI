// ============================================================
// src/repositories/auth.repository.ts — Auth Data Access Layer
// ============================================================
//
// 🎓 TEACHING: The Repository Pattern
//
// The Repository is the ONLY layer that talks to the database.
// It knows about Prisma, SQL, and data shapes.
// It does NOT know about business logic, HTTP, or passwords.
//
// RESPONSIBILITIES:
//   ✅ Create, read, update, delete database records
//   ✅ Map raw DB data to clean objects
//   ❌ NOT: validate input (that's the validator's job)
//   ❌ NOT: hash passwords (that's the service's job)
//   ❌ NOT: generate tokens (that's the JWT util's job)
//
// WHY KEEP IT SEPARATE?
//   If you ever switch from Prisma to raw SQL, or from PostgreSQL
//   to MongoDB, you only change the repository files.
//   Your service files stay identical.
//
// NAMING CONVENTION:
//   findBy* → queries returning one or null
//   findMany* → queries returning arrays
//   create* → insert operations
//   update* → update operations
//   delete* → delete operations
// ============================================================

import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

// ── User Queries ──────────────────────────────────────────────

// Find user by email (used for login)
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Find user by ID (used by auth middleware)
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id, isActive: true },
    // Exclude passwordHash from responses — never send hashes to client
    select: {
      id:              true,
      email:           true,
      name:            true,
      defaultCurrency: true,
      timezone:        true,
      isActive:        true,
      createdAt:       true,
      updatedAt:       true,
    },
  });
}

// Create a new user
export async function createUser(data: {
  email:           string;
  name:            string;
  passwordHash:    string;
  defaultCurrency?: string;
  timezone?:        string;
}) {
  return prisma.user.create({
    data,
    select: {
      id:              true,
      email:           true,
      name:            true,
      defaultCurrency: true,
      timezone:        true,
      createdAt:       true,
    },
  });
}

// Check if email is already registered (for registration)
export async function emailExists(email: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { email } });
  return count > 0;
}

// Update user's last seen / profile
export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id:              true,
      email:           true,
      name:            true,
      defaultCurrency: true,
      timezone:        true,
      updatedAt:       true,
    },
  });
}

// ── Refresh Token Queries ─────────────────────────────────────

// Store a refresh token after login
export async function createRefreshToken(data: {
  token:     string; // This is the HASHED token
  userId:    string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}) {
  return prisma.refreshToken.create({ data });
}

// Find a refresh token by its hash (for rotation verification)
export async function findRefreshToken(hashedToken: string) {
  return prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });
}

// Delete a specific refresh token (logout)
export async function deleteRefreshToken(hashedToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: hashedToken },
  });
}

// Delete ALL refresh tokens for a user (logout from all devices)
export async function deleteAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// Clean up expired tokens (run periodically — production best practice)
export async function deleteExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
